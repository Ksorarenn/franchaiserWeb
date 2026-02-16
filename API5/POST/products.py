from flask import Blueprint, request, jsonify
import json
from db import get_connection

post_products_blueprint = Blueprint("post_products", __name__)


@post_products_blueprint.post("/api/v1/Products")
def add_product():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if data is None:
            try:
                data = json.loads(request.data)
            except json.JSONDecodeError:
                return jsonify({"error": "Неверный формат JSON"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        query = """INSERT INTO Products 
                   (Name, Description, Price, InStock, MinStock, PropensityToSell) 
                   VALUES (?, ?, ?, ?, ?, ?)"""
        params = (
            str(data.get('Name', '')),
            str(data.get('Description', '')),
            float(data.get('Price', 0.0)),
            int(data.get('InStock', 0)),
            int(data.get('MinStock', 0)),
            float(data.get('PropensityToSell', 0.0))
        )
        cursor.execute(query, params)

        conn.commit()
        return jsonify({
            "message": "Запись товара успешно создана"
        }), 201

    except Exception as e:
        print(f"Ошибка при добавлении продукта: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()