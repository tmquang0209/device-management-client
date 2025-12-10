export interface SecurityAlert {
  id: number;
  type: 'login_failure' | 'suspicious_activity' | 'system_intrusion' | 'data_breach' | 'malware_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  ip?: string;
  user?: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

export const securityAlerts: SecurityAlert[] = [
  {
    id: 1,
    type: 'login_failure',
    severity: 'medium',
    title: 'Multiple Login Failures',
    description: 'Detected 15 failed login attempts from the same IP within 10 minutes',
    timestamp: '10 minutes ago',
    ip: '192.168.1.100',
    user: 'admin@example.com',
    status: 'new',
  },
  {
    id: 2,
    type: 'suspicious_activity',
    severity: 'high',
    title: 'Suspicious Activity',
    description: 'Detected access from unknown location during off-hours',
    timestamp: '30 minutes ago',
    ip: '203.113.45.67',
    user: 'user123@example.com',
    status: 'investigating',
  },
  {
    id: 3,
    type: 'system_intrusion',
    severity: 'critical',
    title: 'System Intrusion Alert',
    description: 'Detected unusual changes to system files',
    timestamp: '2 hours ago',
    status: 'new',
  },
  {
    id: 4,
    type: 'malware_detected',
    severity: 'high',
    title: 'Malware Detected',
    description: 'Found suspicious file in uploads directory',
    timestamp: '4 hours ago',
    status: 'resolved',
  },
  {
    id: 5,
    type: 'data_breach',
    severity: 'critical',
    title: 'Suspected Data Breach',
    description: 'Detected unusual access to customer database',
    timestamp: '6 hours ago',
    ip: '45.123.67.89',
    status: 'investigating',
  },
];

export const getSeverityColor = (severity: SecurityAlert['severity']) => {
  switch (severity) {
    case 'low':
      return 'bg-blue-100 text-blue-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusColor = (status: SecurityAlert['status']) => {
  switch (status) {
    case 'new':
      return 'bg-red-100 text-red-700';
    case 'investigating':
      return 'bg-yellow-100 text-yellow-700';
    case 'resolved':
      return 'bg-green-100 text-green-700';
    case 'false_positive':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};