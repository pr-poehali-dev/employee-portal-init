'''
Business: Управление сотрудниками - получение списка, создание, удаление
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id
Returns: HTTP response со списком сотрудников или результатом операции
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Role',
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
            SELECT e.id, u.username, u.full_name, e.position, e.department, 
                   e.email, e.phone, e.hire_date, e.status, u.role
            FROM employees e
            JOIN users u ON e.user_id = u.id
            ORDER BY e.created_at DESC
        """)
        rows = cur.fetchall()
        
        employees = []
        for row in rows:
            employees.append({
                'id': row[0],
                'username': row[1],
                'fullName': row[2],
                'position': row[3],
                'department': row[4],
                'email': row[5],
                'phone': row[6],
                'hireDate': str(row[7]) if row[7] else None,
                'status': row[8],
                'role': row[9]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'employees': employees}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        username = body_data.get('username', '')
        password = body_data.get('password', '')
        full_name = body_data.get('fullName', '')
        position = body_data.get('position', '')
        department = body_data.get('department', '')
        email = body_data.get('email', '')
        phone = body_data.get('phone', '')
        
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cur.execute(
            """INSERT INTO users (username, password_hash, full_name, role) 
               VALUES (%s, %s, %s, 'employee') RETURNING id""",
            (username, password_hash, full_name)
        )
        user_id = cur.fetchone()[0]
        
        cur.execute(
            """INSERT INTO employees (user_id, position, department, email, phone, hire_date) 
               VALUES (%s, %s, %s, %s, %s, CURRENT_DATE) RETURNING id""",
            (user_id, position, department, email, phone)
        )
        employee_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': employee_id, 'userId': user_id, 'message': 'Employee created'}),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        employee_id = body_data.get('id')
        status = body_data.get('status', 'inactive')
        
        cur.execute(
            "UPDATE employees SET status = %s WHERE id = %s",
            (status, employee_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Employee updated'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }