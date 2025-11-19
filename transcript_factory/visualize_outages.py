#!/usr/bin/env python3
"""
Simple visualization of outage-driven call volumes.

Input:
- call_transcripts_with_customers_with_times.csv
  (created by add_call_timestamps.py)

What this script does:
- Loads the CSV and parses the call_datetime column.
- Filters to technical_support calls with an outage_event_id.
- Aggregates call counts into 5-minute buckets per outage event.
- Creates:
  1) A line plot of call volume over time, colored by outage event.
  2) A faceted-style set of subplots (one per outage event).

Usage (from transcript_factory directory):
    python visualize_outages.py

You will see matplotlib windows pop up with the plots.
"""

import os

import matplotlib.pyplot as plt
import pandas as pd


INPUT_FILE = "call_transcripts_with_customers_with_times.csv"


def load_data(input_file: str) -> pd.DataFrame:
    if not os.path.exists(input_file):
        raise FileNotFoundError(
            f"Input file '{input_file}' not found. "
            "Make sure you've run add_call_timestamps.py first."
        )

    df = pd.read_csv(input_file)

    required_cols = {
        "call_id",
        "customer_id",
        "call_reason",
        "call_datetime",
        "outage_event_id",
    }
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(
            f"Missing required columns in {input_file}: {sorted(missing)}\n"
            f"Available columns: {list(df.columns)}"
        )

    # Parse datetime
    df["call_datetime"] = pd.to_datetime(df["call_datetime"], errors="coerce")
    df = df.dropna(subset=["call_datetime"])

    return df


def prepare_outage_timeseries(df: pd.DataFrame) -> pd.DataFrame:
    """
    Filter to outage-related technical_support calls and aggregate
    into 5-minute buckets per outage_event_id.
    """
    mask = (df["call_reason"] == "technical_support") & df["outage_event_id"].notna()
    outage_df = df.loc[mask].copy()

    if outage_df.empty:
        raise ValueError("No outage-related technical_support calls found to plot.")

    outage_df["time_bucket"] = outage_df["call_datetime"].dt.floor("5min")
    grouped = (
        outage_df.groupby(["outage_event_id", "time_bucket"])
        .size()
        .reset_index(name="call_count")
    )
    return grouped


def plot_combined_timeseries(grouped: pd.DataFrame) -> None:
    """
    Single figure with call volume over time, colored by outage_event_id.
    """
    plt.figure(figsize=(10, 6))

    for event_id, sub in grouped.groupby("outage_event_id"):
        sub = sub.sort_values("time_bucket")
        plt.plot(
            sub["time_bucket"],
            sub["call_count"],
            marker="o",
            label=f"Outage {int(event_id)}",
        )

    plt.title("Outage Call Volume Over Time (Technical Support)")
    plt.xlabel("Time (5-minute buckets)")
    plt.ylabel("Number of calls")
    plt.legend()
    plt.tight_layout()


def plot_per_event_subplots(grouped: pd.DataFrame) -> None:
    """
    One subplot per outage event, showing its call volume over time.
    """
    events = sorted(grouped["outage_event_id"].dropna().unique())
    n_events = len(events)

    fig, axes = plt.subplots(n_events, 1, figsize=(10, 2.5 * n_events), sharex=True)
    if n_events == 1:
        axes = [axes]

    for ax, event_id in zip(axes, events):
        sub = grouped[grouped["outage_event_id"] == event_id].sort_values("time_bucket")
        ax.plot(sub["time_bucket"], sub["call_count"], marker="o")
        ax.set_title(f"Outage {int(event_id)}")
        ax.set_ylabel("Calls")

    axes[-1].set_xlabel("Time (5-minute buckets)")
    fig.suptitle("Call Volume by Outage Event (Technical Support)", y=0.98)
    fig.tight_layout(rect=[0, 0, 1, 0.96])


def main():
    print("=" * 60)
    print("VISUALIZE OUTAGE CALL VOLUMES")
    print("=" * 60)

    print(f"Loading data from {INPUT_FILE}...")
    df = load_data(INPUT_FILE)
    print(f"Loaded {len(df)} calls.")

    print("Preparing outage time series (5-minute buckets)...")
    grouped = prepare_outage_timeseries(df)

    print("Creating plots...")
    plot_combined_timeseries(grouped)
    plot_per_event_subplots(grouped)

    print("Showing plots. Close the windows to exit.")
    plt.show()


if __name__ == "__main__":
    main()


