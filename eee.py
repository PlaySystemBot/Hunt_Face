import sqlite3

# Подключаемся к базе данных (создаем подключение)
conn = sqlite3.connect('./instance/users.db')

# Создаем курсор для выполнения SQL-запросов
cursor = conn.cursor()

# Выполняем запрос для получения всех данных из таблицы
cursor.execute("SELECT * FROM user")

# Получаем все строки из результата запроса
rows = cursor.fetchall()

# Выводим каждую строку
for row in rows:
    print(row)

# Закрываем подключение
conn.close()
