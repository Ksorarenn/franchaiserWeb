from flask import Blueprint
from db import get_connection

get_products_blueprint = Blueprint("get_products", __name__)


@get_products_blueprint.get("/api/v1/Products")
def products():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """select ProductID, Name, Description, Price, InStock, MinStock, PropensityToSell from Products"""
        cursor.execute(query)
        product = cursor.fetchall()
        if product:
            product_json = []
            for productit in product:
                product_json.append({
                    "ProductID": productit[0],
                    "Name": productit[1],
                    "Description": productit[2],
                    "Price": productit[3],
                    "InStock": productit[4],
                    "MinStock": productit[5],
                    "PropensityToSell": productit[6]
                })
            return product_json
        else:
            return "Не найдены записи товарах"
    except Exception as e:
        return "Ошибка сервера", 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
