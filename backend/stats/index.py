'''
Business: Получение статистики для дашборда
Args: event - dict с httpMethod
      context - object с request_id
Returns: HTTP response со статистикой системы
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM employees WHERE status = 'active'")
    total_employees = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM requests")
    total_requests = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM requests WHERE status = 'pending'")
    pending_requests = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM requests WHERE status = 'resolved'")
    resolved_requests = cur.fetchone()[0]
    
    cur.execute("""
        SELECT status, COUNT(*) 
        FROM requests 
        GROUP BY status
    """)
    status_breakdown = {}
    for row in cur.fetchall():
        status_breakdown[row[0]] = row[1]
    
    cur.execute("""
        SELECT priority, COUNT(*) 
        FROM requests 
        GROUP BY priority
    """)
    priority_breakdown = {}
    for row in cur.fetchall():
        priority_breakdown[row[0]] = row[1]
    
    cur.close()
    conn.close()
    
    stats = {
        'totalEmployees': total_employees,
        'totalRequests': total_requests,
        'pendingRequests': pending_requests,
        'resolvedRequests': resolved_requests,
        'statusBreakdown': status_breakdown,
        'priorityBreakdown': priority_breakdown
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(stats),
        'isBase64Encoded': False
    }
