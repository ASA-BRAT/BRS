import os
import datetime
from flask import Flask, render_template, abort, request
from werkzeug.utils import safe_join

app = Flask(__name__)

# -------------------------------------------------
# SECRET KEY (нужен для flash‑сообщений, даже если их не используете)
# -------------------------------------------------
app.config["SECRET_KEY"] = os.getenv(
    "SECRET_KEY",
    "dev-secret-key-change-in-production"   # только для локального запуска
)

# -------------------------------------------------
# КОНФИГУРАЦИЯ САЙТА
# -------------------------------------------------
SERVICES = {
    "wheel": {
        "title": "Перетяжка руля",
        "cover": "uploads/wheel/cover.jpg",
        "type": "gallery",
    },
    "roof": {
        "title": "Перетяжка потолка",
        "cover": "uploads/roof/cover.jpg",
        "type": "gallery",
    },
    "hydro": {
        "title": "Аквапринт",
        "cover": "uploads/hydro/cover.jpg",
        "type": "categories",
        "categories": {
            "carbon": {
                "title": "Карбон",
                "cover": "uploads/hydro/carbon/cover.jpg",
            },
            "wood": {
                "title": "Дерево",
                "cover": "uploads/hydro/wood/cover.jpg",
            },
            "marble": {
                "title": "Мрамор",
                "cover": "uploads/hydro/marble/cover.jpg",
            },
        },
    },
}

# -------------------------------------------------
# КОНТЕКСТ‑ПРОЦЕССОРЫ
# -------------------------------------------------
@app.context_processor
def inject_now():
    """Делает текущую дату доступной во всех шаблонах (для футера)."""
    return {"now": datetime.datetime.utcnow()}


# -------------------------------------------------
# ГЛАВНАЯ
# -------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html", services=SERVICES)


# -------------------------------------------------
# СТРАНИЦА УСЛУГИ
# -------------------------------------------------
@app.route("/<service>")
def service(service):
    if service not in SERVICES:
        abort(404)

    data = SERVICES[service]

    if data["type"] == "gallery":
        return open_gallery(service, data["title"])

    return render_template(
        "categories.html",
        service=service,
        title=data["title"],
        categories=data["categories"],
    )


# -------------------------------------------------
# ГАЛЕРЕЯ ПОДКАТЕГОРИИ (например /hydro/carbon)
# -------------------------------------------------
@app.route("/<service>/<category>")
def subcategory(service, category):
    if service not in SERVICES:
        abort(404)

    data = SERVICES[service]

    if data.get("type") != "categories":
        abort(404)

    categories = data.get("categories", {})
    if category not in categories:
        abort(404)

    return open_gallery(
        f"{service}/{category}",
        categories[category]["title"],
    )


# -------------------------------------------------
# ЗАГРУЗКА ФОТОГРАФИЙ (ГАЛЕРЕЯ)
# -------------------------------------------------
def open_gallery(folder, title):
    """
    Возвращает отрендеренный шаблон галереи для указанной папки.
    """
    folder_path = safe_join(app.static_folder, "uploads", folder)

    if folder_path is None or not os.path.isdir(folder_path):
        abort(404)

    images = [
        f
        for f in sorted(os.listdir(folder_path))
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        and f.lower() != "cover.jpg"
    ]

    return render_template(
        "gallery.html",
        title=title,
        folder=folder,
        images=images,
    )


# -------------------------------------------------
# ОБРАБОТЧИКИ ОШИБОК
# -------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_error(e):
    return render_template("500.html"), 500


# -------------------------------------------------
# ЗАПУСК (только для локальной отладки)
# -------------------------------------------------
if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=debug_mode)
