#!/usr/bin/env python3
"""
Script to add realistic datetime stamps to call_transcripts_with_customers.csv
based on outage events and ZIP code distribution.

Inputs:
- ../data/customers.csv                 (customer_id, customer_name, zip, city)
- call_transcripts_with_customers.csv   (call_id, customer_id, call_reason, transcript)

Output:
- call_transcripts_with_customers_with_times.csv

Logic overview
--------------
1. Load customers and transcripts-with-customers.
2. Join to get ZIP for each call (via customer_id).
3. Map each ZIP to one of 5 outage events defined in data_requirements.
4. For technical_support calls, assign timestamps inside the corresponding
   outage window using the specified time-bucket distribution:
      - 0–15 minutes: 40%
      - 15–30 minutes: 30%
      - 30–45 minutes: 20%
      - 45–60 minutes: 7%
      - 60+ minutes:   3%
5. For non-technical calls, assign timestamps uniformly in the overall
   date range 2025-11-16 to 2025-11-21, avoiding outage windows to
   keep outage surges visually distinct.

This script does not modify the original CSV; it writes a new file
with an extra 'call_datetime' column (string, ISO-like format).
"""

import random
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import pandas as pd


# ---------------------------------------------------------------------------
# Outage configuration (mirrors data_requirements)
# ---------------------------------------------------------------------------

@dataclass
class OutageEvent:
    event_id: int
    zipcodes: List[str]
    start: datetime
    end: datetime


# Define the five outage events with exact times from data_requirements
OUTAGE_EVENTS: List[OutageEvent] = [
    OutageEvent(
        event_id=1,
        zipcodes=["75201", "75234", "75219", "75232"],
        start=datetime(2025, 11, 16, 10, 15),
        end=datetime(2025, 11, 16, 11, 32),
    ),
    OutageEvent(
        event_id=2,
        zipcodes=["06673", "06604"],
        start=datetime(2025, 11, 18, 13, 11),
        end=datetime(2025, 11, 18, 14, 21),
    ),
    OutageEvent(
        event_id=3,
        zipcodes=["75209", "75228", "75230"],
        start=datetime(2025, 11, 19, 10, 32),
        end=datetime(2025, 11, 19, 12, 1),
    ),
    OutageEvent(
        event_id=4,
        zipcodes=["06611", "06606"],
        start=datetime(2025, 11, 20, 14, 20),
        end=datetime(2025, 11, 20, 15, 25),
    ),
    OutageEvent(
        event_id=5,
        zipcodes=["75217", "75252"],
        start=datetime(2025, 11, 21, 11, 5),
        end=datetime(2025, 11, 21, 12, 20),
    ),
]


# Time bucket distribution inside each outage window
# Each tuple is (start_minute_from_outage_start, end_minute_from_outage_start_or_None, probability_weight)
TIME_BUCKETS = [
    (0, 15, 0.40),   # 0–15 minutes
    (15, 30, 0.30),  # 15–30 minutes
    (30, 45, 0.20),  # 30–45 minutes
    (45, 60, 0.07),  # 45–60 minutes
    (60, None, 0.03) # 60+ minutes (until outage end)
]

# Overall date range for non-outage calls (non-technical_support)
NON_OUTAGE_START = datetime(2025, 11, 16, 8, 0)
NON_OUTAGE_END = datetime(2025, 11, 21, 20, 0)


def _normalize_zip(zip_value: str) -> str:
    """
    Normalize ZIP codes to 5-character strings with leading zeros if needed.
    """
    zip_str = str(zip_value).strip()
    # Remove any trailing .0 from float-like strings
    if "." in zip_str:
        zip_str = zip_str.split(".")[0]
    # Pad with leading zeros up to 5 digits
    if zip_str.isdigit() and len(zip_str) < 5:
        zip_str = zip_str.zfill(5)
    return zip_str


def build_zip_to_event_map(events: List[OutageEvent]) -> Dict[str, OutageEvent]:
    """Create a lookup: ZIP -> OutageEvent."""
    mapping: Dict[str, OutageEvent] = {}
    for event in events:
        for z in event.zipcodes:
            mapping[_normalize_zip(z)] = event
    return mapping


ZIP_TO_EVENT: Dict[str, OutageEvent] = build_zip_to_event_map(OUTAGE_EVENTS)


def pick_time_in_bucket(event: OutageEvent, bucket_index: int) -> datetime:
    """
    Given an outage event and a bucket index, pick a random timestamp within that bucket.
    """
    start_min, end_min, _ = TIME_BUCKETS[bucket_index]
    bucket_start = event.start + timedelta(minutes=start_min)

    if end_min is None:
        bucket_end = event.end
    else:
        bucket_end = event.start + timedelta(minutes=end_min)
        if bucket_end > event.end:
            bucket_end = event.end

    # Protect against zero-length buckets
    if bucket_end <= bucket_start:
        return bucket_start

    total_seconds = int((bucket_end - bucket_start).total_seconds())
    offset_seconds = random.randint(0, total_seconds - 1)
    return bucket_start + timedelta(seconds=offset_seconds)


def pick_non_outage_time() -> datetime:
    """
    Pick a random timestamp in the global NON_OUTAGE_* range,
    explicitly avoiding all outage windows so the outage surges stand out.
    """
    total_seconds = int((NON_OUTAGE_END - NON_OUTAGE_START).total_seconds())

    while True:
        offset = random.randint(0, total_seconds)
        candidate = NON_OUTAGE_START + timedelta(seconds=offset)

        # Check if candidate is inside any outage window
        in_outage = any(e.start <= candidate <= e.end for e in OUTAGE_EVENTS)
        if not in_outage:
            return candidate


def assign_outage_timestamps(
    df: pd.DataFrame,
    zip_to_event: Dict[str, OutageEvent],
) -> pd.Series:
    """
    Assign timestamps for all rows in df, using:
    - Outage windows for technical_support calls (based on ZIP)
    - Non-outage windows for other call reasons

    Returns a pandas Series of ISO-formatted datetime strings.
    """
    timestamps: List[Optional[datetime]] = [None] * len(df)

    # Split indices by event for technical_support calls
    technical_mask = df["call_reason"] == "technical_support"
    non_technical_indices: List[int] = []
    event_to_indices: Dict[int, List[int]] = {}

    for idx, row in df.iterrows():
        if pd.isna(row.get("zip")):
            # No ZIP: treat as non-outage
            non_technical_indices.append(idx)
            continue

        zip_norm = _normalize_zip(row["zip"])
        event = zip_to_event.get(zip_norm)

        if technical_mask.iloc[idx] and event is not None:
            event_to_indices.setdefault(event.event_id, []).append(idx)
        else:
            non_technical_indices.append(idx)

    # Assign outage-based timestamps for technical_support calls
    bucket_weights = [b[2] for b in TIME_BUCKETS]

    for event_id, indices in event_to_indices.items():
        event = next(e for e in OUTAGE_EVENTS if e.event_id == event_id)
        if not indices:
            continue

        # Choose a bucket for each call according to the given weights
        chosen_buckets = random.choices(
            population=list(range(len(TIME_BUCKETS))),
            weights=bucket_weights,
            k=len(indices),
        )

        for idx, bucket_index in zip(indices, chosen_buckets):
            timestamps[idx] = pick_time_in_bucket(event, bucket_index)

    # Assign non-outage timestamps for everything else
    for idx in non_technical_indices:
        timestamps[idx] = pick_non_outage_time()

    # Convert to strings
    ts_strings = [
        ts.strftime("%Y-%m-%d %H:%M:%S") if ts is not None else ""
        for ts in timestamps
    ]
    return pd.Series(ts_strings, index=df.index, name="call_datetime")


def main():
    print("=" * 70)
    print("ADD DATETIME STAMPS TO CALL TRANSCRIPTS (WITH CUSTOMERS)")
    print("=" * 70)

    # Make randomness reproducible
    random.seed(42)

    customers_file = "../data/customers.csv"
    transcripts_file = "call_transcripts_with_customers.csv"
    output_file = "call_transcripts_with_customers_with_times.csv"

    print(f"Loading customers from: {customers_file}")
    customers_df = pd.read_csv(customers_file)

    required_customer_cols = {"customer_id", "customer_name", "zip", "city"}
    if not required_customer_cols.issubset(customers_df.columns):
        raise ValueError(
            f"customers.csv missing required columns. "
            f"Found: {list(customers_df.columns)}, "
            f"Required: {sorted(required_customer_cols)}"
        )

    print(f"Loading transcripts-with-customers from: {transcripts_file}")
    calls_df = pd.read_csv(transcripts_file)

    required_call_cols = {"call_id", "customer_id", "call_reason", "transcript"}
    if not required_call_cols.issubset(calls_df.columns):
        raise ValueError(
            f"call_transcripts_with_customers.csv missing required columns. "
            f"Found: {list(calls_df.columns)}, "
            f"Required: {sorted(required_call_cols)}"
        )

    print(f"Loaded {len(customers_df)} customers and {len(calls_df)} calls.")

    # Join to bring ZIP onto each call
    print("\nMerging ZIP codes onto calls via customer_id...")
    customers_trimmed = customers_df[["customer_id", "zip", "city"]].copy()
    calls_with_zip = calls_df.merge(
        customers_trimmed, on="customer_id", how="left", validate="many_to_one"
    )

    missing_zip = calls_with_zip["zip"].isna().sum()
    if missing_zip:
        print(f"WARNING: {missing_zip} calls have no ZIP (customer_id not found).")

    # Assign event IDs (optional, handy for debugging/analysis)
    print("Assigning outage events by ZIP...")
    event_ids: List[Optional[int]] = []
    for _, row in calls_with_zip.iterrows():
        if pd.isna(row.get("zip")):
            event_ids.append(None)
            continue
        zip_norm = _normalize_zip(row["zip"])
        event = ZIP_TO_EVENT.get(zip_norm)
        event_ids.append(event.event_id if event is not None else None)
    calls_with_zip["outage_event_id"] = event_ids

    # Assign datetime stamps
    print("Assigning call timestamps (outage vs non-outage)...")
    calls_with_zip["call_datetime"] = assign_outage_timestamps(
        calls_with_zip, ZIP_TO_EVENT
    )

    # Reorder columns: keep original first, then zip/city, event, datetime
    base_cols = ["call_id", "customer_id", "call_reason", "transcript"]
    extra_cols = ["zip", "city", "outage_event_id", "call_datetime"]
    ordered_cols = [c for c in base_cols + extra_cols if c in calls_with_zip.columns]
    calls_with_zip = calls_with_zip[ordered_cols]

    print(f"\nSaving updated calls with datetime to: {output_file}")
    calls_with_zip.to_csv(output_file, index=False)
    print(f"✓ Saved {len(calls_with_zip)} rows.")

    print("\nSample of updated data:")
    print(calls_with_zip.head(5))

    print("\nDone.")
    print("=" * 70)


if __name__ == "__main__":
    main()


