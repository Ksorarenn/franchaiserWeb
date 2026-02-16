from flask import Blueprint
from db import get_connection

get_users_blueprint = Blueprint("get_users", __name__)


@get_users_blueprint.get("/api/v1/Users")
def users():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """select *from Users"""
        cursor.execute(query)
        user = cursor.fetchall()
        if user:
            users_json = []
            for userit in user:
                users_json.append({
                    "UserID": userit[0],
                    "FullName": userit[1],
                    "Contacts": userit[2],
                    "Role": userit[3]
                })
            return users_json
        else:
            return "Не найдены записи о пользователях"
    except Exception as e:
        return "Ошибка сервера", 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
