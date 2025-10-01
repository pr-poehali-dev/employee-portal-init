'''
Business: Управление заявками - создание, получение списка, обновление статуса
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id
Returns: HTTP response со списком заявок или результатом операции
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("""
            SELECT r.id, r.title, r.description, r.status, r.priority, 
                   r.created_at, r.updated_at, u.full_name, u.username
            FROM requests r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        """)
        rows = cur.fetchall()
        
        requests_list = []
        for row in rows:
            requests_list.append({
                'id': row[0],
                'title': row[1],
                'description': row[2],
                'status': row[3],
                'priority': row[4],
                'createdAt': str(row[5]),
                'updatedAt': str(row[6]),
                'authorName': row[7],
                'authorUsername': row[8]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'requests': requests_list}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('userId')
        title = body_data.get('title')
        description = body_data.get('description')
        priority = body_data.get('priority', 'medium')
        
        cur.execute(
            """INSERT INTO requests (user_id, title, description, priority) 
               VALUES (%s, %s, %s, %s) RETURNING id""",
            (user_id, title, description, priority)
        )
        request_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': request_id, 'message': 'Request created'}),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        request_id = body_data.get('id')
        status = body_data.get('status')
        
        cur.execute(
            "UPDATE requests SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (status, request_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Request updated'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
