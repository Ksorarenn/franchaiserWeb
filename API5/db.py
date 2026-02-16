import pyodbc

def get_connection():
    try:
        conn = pyodbc.connect(
            driver='{ODBC Driver 17 for SQL Server}',
            server='KOSYAN\\SQLEXPRESS',
            database='VendingDB',
            trusted_connection='yes'
        )
        print("✓ Успешно подключились к БД")
        return conn
    except Exception as e:
        print(f"✗ Ошибка подключения к БД: {e}")
        return None