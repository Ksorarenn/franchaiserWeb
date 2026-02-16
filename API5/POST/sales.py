from datetime import datetime

from flask import Blueprint, request, jsonify
import json
from db import get_connection

post_sales_blueprint = Blueprint("post_sales", __name__)

@post_sales_blueprint.post("/api/v1/Sales")
def add_sale():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if data is None:
            return jsonify({"error": "Неверный формат JSON"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        query = """INSERT INTO Sales 
                   (ProductID, MachineID, Quantity, SaleSum, PaymentTypeID, SaleDateTime) 
                   VALUES (?, ?, ?, ?, ?, GETDATE())"""
        params = (
            int(data['ProductID']),
            int(data['MachineID']),
            int(data['Quantity']),
            int(data['SaleSum']),
            int(data['PaymentTypeID'])
        )
        cursor.execute(query, params)

        conn.commit()
        return jsonify({
            "message": "Запись продажи успешно создана"
        }), 201

    except KeyError as e:
        return jsonify({"error": f"Отсутствует обязательное поле: {str(e)}"}), 400
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()