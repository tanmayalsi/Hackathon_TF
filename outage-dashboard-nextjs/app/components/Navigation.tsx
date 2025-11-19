'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, MessageSquare, Users } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Outage Dashboard',
      href: '/',
      icon: Activity,
      active: pathname === '/',
    },
    {
      name: 'Social Media',
      href: '/social-media',
      icon: MessageSquare,
      active: pathname === '/social-media',
    },
    {
      name: 'Customer Intelligence',
      href: '/customer-intelligence',
      icon: Users,
      active: pathname === '/customer-intelligence',
    },
  ];

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-6 py-4 text-sm font-medium transition-colors ${
                  tab.active
                    ? 'text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </div>
                {tab.active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

