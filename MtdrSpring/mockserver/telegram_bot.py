import logging
import os
import requests
from datetime import datetime
import asyncio
from typing import Dict, List, Optional, Tuple, Union, Any
from dotenv import load_dotenv

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    ConversationHandler,
    filters,
)

# Cargar variables de entorno desde .env
load_dotenv()

# Configuración básica de logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# URL base de la API de tareas - se puede sobreescribir desde el .env
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api")

# Estados para el ConversationHandler
(
    MENU_PRINCIPAL,
    SELECCION_USUARIO,
    LISTA_TAREAS,
    MENU_TAREA,
    CAMBIAR_ESTATUS,
    CAMBIAR_TAG,
    EDITAR_NOMBRE,
    EDITAR_FECHAS,
    VER_COMENTARIOS,
    CREAR_COMENTARIO,
    CREAR_TAREA,
    CREAR_TAREA_TITULO,
    CREAR_TAREA_DESCRIPCION,
    CREAR_TAREA_TAG,
    CREAR_TAREA_FECHAS,
    CREAR_TAREA_ASIGNAR,
) = range(16)

# Helper para hacer peticiones a la API
def api_request(
    endpoint: str, method: str = "GET", data: Optional[Dict] = None, params: Optional[Dict] = None
) -> Dict:
    """Realizar petición a la API"""
    url = f"{API_BASE_URL}/{endpoint}"
    
    # Crear una sesión para mantener las cookies entre solicitudes
    session = requests.Session()
    
    try:
        if method == "GET":
            response = session.get(url, params=params)
        elif method == "POST":
            response = session.post(url, json=data)
        elif method == "PUT":
            response = session.put(url, json=data)
        elif method == "DELETE":
            response = session.delete(url)
        
        # Verificar si es un error de autenticación
        if response.status_code == 401:
            # Intentar establecer una identidad por defecto y reintentar
            logger.info("Error de autenticación, intentando establecer identidad por defecto...")
            default_user = 1  # ID del usuario por defecto (ajusta según tu base de datos)
            session.post(f"{API_BASE_URL}/identity/set/{default_user}")
            
            # Reintentar la solicitud original
            if method == "GET":
                response = session.get(url, params=params)
            elif method == "POST":
                response = session.post(url, json=data)
            elif method == "PUT":
                response = session.put(url, json=data)
            elif method == "DELETE":
                response = session.delete(url)
        
        response.raise_for_status()
        if response.status_code == 204:  # No content
            return {"success": True}
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error en petición API: {e}")
        return {"error": str(e)}

# Comandos y acciones principales
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Iniciar la conversación y mostrar el menú principal."""
    context.user_data.clear()  # Limpiar datos previos
    
    await update.message.reply_text(
        "Hola. Observa las opciones en el menú de comandos.",
        reply_markup=ReplyKeyboardMarkup(
            [
                ["Listar mis tareas"],
                ["Crear nueva tarea"],
                ["Seleccionar usuario"],
                ["Salir"]
            ],
            resize_keyboard=True,
            one_time_keyboard=False,
        ),
    )
    return MENU_PRINCIPAL

async def menu_principal(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Maneja las selecciones del menú principal."""
    text = update.message.text
    
    if text == "Listar mis tareas":
        # Verificar si hay un usuario seleccionado
        if not context.user_data.get("current_user"):
            await listar_usuarios(update, context)
            return SELECCION_USUARIO
        else:
            return await listar_tareas(update, context)
    
    elif text == "Crear nueva tarea":
        # Verificar si hay un usuario seleccionado
        if not context.user_data.get("current_user"):
            await update.message.reply_text("Primero debes seleccionar un usuario.")
            await listar_usuarios(update, context)
            return SELECCION_USUARIO
        else:
            return await iniciar_creacion_tarea(update, context)
    
    elif text == "Seleccionar usuario":
        return await listar_usuarios(update, context)
    
    elif text == "Salir":
        await update.message.reply_text(
            "Hola. Teclea /start para empezar.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return ConversationHandler.END
    
    await update.message.reply_text("Opción no válida. Por favor, selecciona una opción del menú.")
    return MENU_PRINCIPAL

async def listar_usuarios(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Listar usuarios disponibles para selección de identidad."""
    usuarios = api_request("users/")
    
    if "error" in usuarios:
        await update.message.reply_text(f"Error al obtener usuarios: {usuarios['error']}")
        return MENU_PRINCIPAL
    
    keyboard = []
    for usuario in usuarios:
        keyboard.append([
            InlineKeyboardButton(
                f"{usuario['nombre']} ({usuario['role']})", 
                callback_data=f"user_{usuario['id']}"
            )
        ])
    
    await update.message.reply_text(
        "Selecciona tu identidad:",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return SELECCION_USUARIO

async def seleccionar_usuario(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar la selección de usuario."""
    query = update.callback_query
    await query.answer()
    
    user_id = query.data.split("_")[1]
    response = api_request(f"identity/set/{user_id}", method="POST")
    
    if "error" in response:
        await query.edit_message_text(f"Error al seleccionar usuario: {response['error']}")
        return MENU_PRINCIPAL
    
    # Obtener información del usuario seleccionado
    user_info = api_request(f"users/{user_id}")
    if "error" not in user_info:
        context.user_data["current_user"] = user_info
    
    await query.edit_message_text(f"Identidad establecida como: {user_info['nombre']} ({user_info['role']})")
    
    # Volver al menú principal
    await query.message.reply_text(
        "¿Qué deseas hacer ahora?",
        reply_markup=ReplyKeyboardMarkup(
            [
                ["Listar mis tareas"],
                ["Crear nueva tarea"],
                ["Seleccionar usuario"],
                ["Salir"]
            ],
            resize_keyboard=True,
        ),
    )
    return MENU_PRINCIPAL

async def listar_tareas(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Listar las tareas del usuario actual."""
    if not context.user_data.get("current_user"):
        await update.message.reply_text("Primero debes seleccionar un usuario.")
        return await listar_usuarios(update, context)
    
    # Obtener las tareas asignadas al usuario actual
    params = {"view_mode": "assigned", "skip": context.user_data.get("task_offset", 0), "limit": 5}
    tareas = api_request("tasks/", params=params)
    
    if "error" in tareas:
        await update.message.reply_text(f"Error al obtener tareas: {tareas['error']}")
        return MENU_PRINCIPAL
    
    if not tareas:
        await update.message.reply_text("No tienes tareas asignadas.")
        return MENU_PRINCIPAL
    
    # Guardar las tareas en el contexto
    context.user_data["tareas"] = tareas
    
    keyboard = []
    for tarea in tareas:
        keyboard.append([InlineKeyboardButton(tarea["title"], callback_data=f"task_{tarea['id']}")])
    
    # Botones de navegación
    nav_buttons = []
    if context.user_data.get("task_offset", 0) > 0:
        nav_buttons.append(InlineKeyboardButton("⬅️ Anteriores", callback_data="prev_tasks"))
    
    if len(tareas) == 5:  # Si hay 5 tareas, probablemente hay más
        nav_buttons.append(InlineKeyboardButton("Siguientes ➡️", callback_data="next_tasks"))
    
    if nav_buttons:
        keyboard.append(nav_buttons)
    
    # Botón para volver al menú principal
    keyboard.append([InlineKeyboardButton("Volver al menú", callback_data="back_to_menu")])
    
    message_text = "Tareas (Por fecha reciente):\n"
    
    # Puede ser una respuesta nueva o una edición de mensaje existente
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            text=message_text,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
    else:
        await update.message.reply_text(
            text=message_text,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
    
    return LISTA_TAREAS

async def navegacion_tareas(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Manejar la navegación entre páginas de tareas."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "next_tasks":
        # Incrementar el offset para ver las siguientes tareas
        current_offset = context.user_data.get("task_offset", 0)
        context.user_data["task_offset"] = current_offset + 5
    elif query.data == "prev_tasks":
        # Decrementar el offset para ver las anteriores tareas
        current_offset = context.user_data.get("task_offset", 0)
        context.user_data["task_offset"] = max(0, current_offset - 5)
    elif query.data == "back_to_menu":
        await query.message.reply_text(
            "Volviendo al menú principal",
            reply_markup=ReplyKeyboardMarkup(
                [
                    ["Listar mis tareas"],
                    ["Crear nueva tarea"],
                    ["Seleccionar usuario"],
                    ["Salir"]
                ],
                resize_keyboard=True,
            ),
        )
        return MENU_PRINCIPAL
    
    # Mostrar la nueva lista de tareas
    return await listar_tareas(update, context)

async def seleccionar_tarea(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Mostrar detalles de la tarea seleccionada."""
    query = update.callback_query
    await query.answer()
    
    task_id = query.data.split("_")[1]
    tarea = api_request(f"tasks/{task_id}")
    
    if "error" in tarea:
        await query.edit_message_text(f"Error al obtener la tarea: {tarea['error']}")
        return LISTA_TAREAS
    
    # Guardar la tarea actual en el contexto
    context.user_data["tarea_actual"] = tarea
    
    # Generar mensaje con detalles de la tarea
    message = f"Elegiste: {tarea['title']}\n\n"
    message += f"Estatus: {tarea['status']}\n"
    message += f"Tag: {tarea['tag']}\n"
    message += f"Inicio: {tarea['startDate']}\n"
    message += f"Fin: {tarea['endDate'] if tarea['endDate'] else 'No definido'}\n\n"
    message += "¿Qué operación deseas realizar?"
    
    # Opciones para interactuar con la tarea
    keyboard = [
        [InlineKeyboardButton("Estatus", callback_data="change_status")],
        [InlineKeyboardButton("Tag", callback_data="change_tag")],
        [InlineKeyboardButton("Editar Nombre", callback_data="edit_name")],
        [InlineKeyboardButton("Editar Fechas", callback_data="edit_dates")],
        [InlineKeyboardButton("Comentarios", callback_data="view_comments")],
        [InlineKeyboardButton("Salir", callback_data="back_to_tasks")],
    ]
    
    await query.edit_message_text(
        text=message,
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    
    return MENU_TAREA

async def menu_tarea(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Manejar las opciones del menú de tarea."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "change_status":
        # Mostrar opciones de estatus
        keyboard = [
            [InlineKeyboardButton("En progreso", callback_data="status_En progreso")],
            [InlineKeyboardButton("Completada", callback_data="status_Completada")],
            [InlineKeyboardButton("Backlog", callback_data="status_Backlog")],
            [InlineKeyboardButton("Cancelada", callback_data="status_Cancelada")],
            [InlineKeyboardButton("Volver", callback_data="back_to_task_menu")],
        ]
        
        await query.edit_message_text(
            "Selecciona el nuevo estatus:",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return CAMBIAR_ESTATUS
    
    elif query.data == "change_tag":
        # Mostrar opciones de tag
        keyboard = [
            [InlineKeyboardButton("Feature", callback_data="tag_Feature")],
            [InlineKeyboardButton("Issue", callback_data="tag_Issue")],
            [InlineKeyboardButton("Volver", callback_data="back_to_task_menu")],
        ]
        
        await query.edit_message_text(
            "Selecciona el nuevo tag:",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return CAMBIAR_TAG
    
    elif query.data == "edit_name":
        tarea = context.user_data["tarea_actual"]
        await query.edit_message_text(
            f"Nombre actual: {tarea['title']}\n\n"
            "Para editar, teclea el nuevo nombre:\n\n"
            "Escribe 'cancelar' para volver sin cambios.",
        )
        return EDITAR_NOMBRE
    
    elif query.data == "edit_dates":
        tarea = context.user_data["tarea_actual"]
        await query.edit_message_text(
            f"Fechas actuales:\n"
            f"Inicio: {tarea['startDate']}\n"
            f"Fin: {tarea['endDate'] if tarea['endDate'] else 'No definido'}\n\n"
            "Para editar, teclea uno o ambos:\n"
            "Inicio YYYY-MM-DD\n"
            "Fin YYYY-MM-DD\n\n"
            "Escribe 'cancelar' para volver sin cambios.",
        )
        return EDITAR_FECHAS
    
    elif query.data == "view_comments":
        return await ver_comentarios(update, context)
    
    elif query.data == "back_to_tasks":
        # Volver a la lista de tareas
        return await listar_tareas(update, context)
    
    elif query.data == "back_to_task_menu":
        # Volver al menú de la tarea
        tarea = context.user_data["tarea_actual"]
        return await mostrar_menu_tarea(query, tarea)
    
    return MENU_TAREA

async def mostrar_menu_tarea(query, tarea: Dict) -> int:
    """Mostrar el menú de la tarea actual."""
    message = f"Elegiste: {tarea['title']}\n\n"
    message += f"Estatus: {tarea['status']}\n"
    message += f"Tag: {tarea['tag']}\n"
    message += f"Inicio: {tarea['startDate']}\n"
    message += f"Fin: {tarea['endDate'] if tarea['endDate'] else 'No definido'}\n\n"
    message += "¿Qué operación deseas realizar?"
    
    keyboard = [
        [InlineKeyboardButton("Estatus", callback_data="change_status")],
        [InlineKeyboardButton("Tag", callback_data="change_tag")],
        [InlineKeyboardButton("Editar Nombre", callback_data="edit_name")],
        [InlineKeyboardButton("Editar Fechas", callback_data="edit_dates")],
        [InlineKeyboardButton("Comentarios", callback_data="view_comments")],
        [InlineKeyboardButton("Salir", callback_data="back_to_tasks")],
    ]
    
    await query.edit_message_text(
        text=message,
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    
    return MENU_TAREA

async def cambiar_estatus(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cambiar el estatus de una tarea."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_task_menu":
        tarea = context.user_data["tarea_actual"]
        return await mostrar_menu_tarea(query, tarea)
    
    # Obtener el nuevo estatus
    nuevo_estatus = query.data.split("_", 1)[1]
    tarea = context.user_data["tarea_actual"]
    
    # Actualizar el estatus en la API
    response = api_request(
        f"tasks/{tarea['id']}/status", 
        method="PUT", 
        data={"status": nuevo_estatus}
    )
    
    if "error" in response:
        await query.edit_message_text(f"Error al actualizar estatus: {response['error']}")
        return MENU_TAREA
    
    # Actualizar la tarea en el contexto
    tarea_actualizada = api_request(f"tasks/{tarea['id']}")
    context.user_data["tarea_actual"] = tarea_actualizada
    
    # Mostrar confirmación
    await query.edit_message_text(f"Estatus cambia a '{nuevo_estatus}'")
    
    # Volver al menú de la tarea después de un breve retraso
    await asyncio.sleep(1.5)
    return await mostrar_menu_tarea(query, tarea_actualizada)

async def cambiar_tag(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cambiar el tag de una tarea."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_task_menu":
        tarea = context.user_data["tarea_actual"]
        return await mostrar_menu_tarea(query, tarea)
    
    # Obtener el nuevo tag
    nuevo_tag = query.data.split("_", 1)[1]
    tarea = context.user_data["tarea_actual"]
    
    # Actualizar el tag en la API
    response = api_request(
        f"tasks/{tarea['id']}", 
        method="PUT", 
        data={"tag": nuevo_tag}
    )
    
    if "error" in response:
        await query.edit_message_text(f"Error al actualizar tag: {response['error']}")
        return MENU_TAREA
    
    # Actualizar la tarea en el contexto
    tarea_actualizada = api_request(f"tasks/{tarea['id']}")
    context.user_data["tarea_actual"] = tarea_actualizada
    
    # Mostrar confirmación
    await query.edit_message_text(f"Tag cambia a '{nuevo_tag}'")
    
    # Volver al menú de la tarea después de un breve retraso
    await asyncio.sleep(1.5)
    return await mostrar_menu_tarea(query, tarea_actualizada)

async def editar_nombre(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar la edición del nombre de una tarea."""
    nuevo_nombre = update.message.text
    
    if nuevo_nombre.lower() == "cancelar":
        # Volver al menú de la tarea sin hacer cambios
        keyboard = [
            [InlineKeyboardButton("Volver al menú de tarea", callback_data="back_to_task_menu")],
        ]
        
        await update.message.reply_text(
            "Operación cancelada.",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return MENU_TAREA
    
    tarea = context.user_data["tarea_actual"]
    
    # Actualizar el nombre en la API
    response = api_request(
        f"tasks/{tarea['id']}", 
        method="PUT", 
        data={"title": nuevo_nombre}
    )
    
    if "error" in response:
        await update.message.reply_text(f"Error al actualizar nombre: {response['error']}")
        
        keyboard = [
            [InlineKeyboardButton("Volver al menú de tarea", callback_data="back_to_task_menu")],
        ]
        
        await update.message.reply_text(
            "Error al actualizar. Intenta de nuevo.",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return MENU_TAREA
    
    # Actualizar la tarea en el contexto
    tarea_actualizada = api_request(f"tasks/{tarea['id']}")
    context.user_data["tarea_actual"] = tarea_actualizada
    
    # Mostrar confirmación y volver al menú de la tarea
    keyboard = [
        [InlineKeyboardButton("Volver al menú de tarea", callback_data="back_to_task_menu")],
    ]
    
    await update.message.reply_text(
        f"Nombre actualizado a: {nuevo_nombre}",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    
    return MENU_TAREA

async def editar_fechas(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar la edición de fechas de una tarea."""
    texto = update.message.text
    
    if texto.lower() == "cancelar":
        # Volver al menú de la tarea sin hacer cambios
        keyboard = [
            [InlineKeyboardButton("Volver al menú de tarea", callback_data="back_to_task_menu")],
        ]
        
        await update.message.reply_text(
            "Operación cancelada.",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return MENU_TAREA
    
    tarea = context.user_data["tarea_actual"]
    data_update = {}
    
    # Procesar las líneas del texto para extraer fechas
    for linea in texto.split("\n"):
        if linea.lower().startswith("inicio "):
            try:
                fecha = linea[7:].strip()  # Obtener la parte de la fecha
                # Validar formato de fecha
                datetime.strptime(fecha, "%Y-%m-%d")
                data_update["startDate"] = fecha
            except ValueError:
                await update.message.reply_text(
                    "Formato de fecha de inicio incorrecto. Usa YYYY-MM-DD."
                )
                return EDITAR_FECHAS
        
        elif linea.lower().startswith("fin "):
            try:
                fecha = linea[4:].strip()  # Obtener la parte de la fecha
                # Validar formato de fecha
                datetime.strptime(fecha, "%Y-%m-%d")
                data_update["endDate"] = fecha
            except ValueError:
                await update.message.reply_text(
                    "Formato de fecha de fin incorrecto. Usa YYYY-MM-DD."
                )
                return EDITAR_FECHAS
    
    if not data_update:
        await update.message.reply_text(
            "No se detectaron fechas para actualizar. Usa el formato:\n"
            "Inicio YYYY-MM-DD\n"
            "Fin YYYY-MM-DD"
        )
        return EDITAR_FECHAS
    
    # Actualizar fechas en la API
    response = api_request(
        f"tasks/{tarea['id']}", 
        method="PUT", 
        data=data_update
    )
    
    if "error" in response:
        await update.message.reply_text(f"Error al actualizar fechas: {response['error']}")
        
        keyboard = [
            [InlineKeyboardButton("Volver al menú de tarea", callback_data="back_to_task_menu")],
        ]
        
        await update.message.reply_text(
            "Error al actualizar. Intenta de nuevo.",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return MENU_TAREA
    
    # Actualizar la tarea en el contexto
    tarea_actualizada = api_request(f"tasks/{tarea['id']}")
    context.user_data["tarea_actual"] = tarea_actualizada
    
    # Mostrar confirmación y volver al menú de la tarea
    mensaje = "Fechas actualizadas:\n"
    if "startDate" in data_update:
        mensaje += f"Inicio: {data_update['startDate']}\n"
    if "endDate" in data_update:
        mensaje += f"Fin: {data_update['endDate']}"
    
    keyboard = [
        [InlineKeyboardButton("Volver al menú de tarea", callback_data="back_to_task_menu")],
    ]
    
    await update.message.reply_text(
        mensaje,
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    
    return MENU_TAREA

async def ver_comentarios(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Ver los comentarios de una tarea."""
    query = update.callback_query
    if query:
        await query.answer()
    
    tarea = context.user_data["tarea_actual"]
    
    # Obtener comentarios de la API
    comentarios = api_request(f"tasks/{tarea['id']}/comments")
    
    if "error" in comentarios:
        if query:
            await query.edit_message_text(f"Error al obtener comentarios: {comentarios['error']}")
        else:
            await update.message.reply_text(f"Error al obtener comentarios: {comentarios['error']}")
        return MENU_TAREA
    
    # Generar mensaje con los comentarios
    message = f"Comentarios de la tarea: {tarea['title']}\n\n"
    
    if not comentarios:
        message += "No hay comentarios aún."
    else:
        for comentario in comentarios:
            message += f"{comentario['created_by']} ({comentario['created_at'].split('T')[0]}):\n"
            message += f"{comentario['content']}\n\n"
    
    # Opciones para comentarios
    keyboard = [
        [InlineKeyboardButton("Crear comentario", callback_data="create_comment")],
        [InlineKeyboardButton("Volver", callback_data="back_to_task_menu")],
    ]
    
    if query:
        await query.edit_message_text(
            text=message,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
    else:
        await update.message.reply_text(
            text=message,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
    
    return VER_COMENTARIOS

async def crear_comentario(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Iniciar proceso de creación de comentario."""
    query = update.callback_query
    await query.answer()
    
    await query.edit_message_text(
        "Escribe tu comentario:\n\n"
        "Escribe 'cancelar' para volver sin crear comentario.",
    )
    
    return CREAR_COMENTARIO

async def procesar_comentario(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar el comentario ingresado."""
    contenido = update.message.text
    
    if contenido.lower() == "cancelar":
        # Volver a la vista de comentarios sin crear uno nuevo
        return await ver_comentarios(update, context)
    
    tarea = context.user_data["tarea_actual"]
    user = context.user_data["current_user"]
    
    # Crear comentario en la API
    response = api_request(
        f"tasks/{tarea['id']}/comments", 
        method="POST", 
        data={
            "content": contenido,
            "created_by_id": user["id"]
        }
    )
    
    if "error" in response:
        await update.message.reply_text(f"Error al crear comentario: {response['error']}")
        
        keyboard = [
            [InlineKeyboardButton("Volver a comentarios", callback_data="view_comments")],
        ]
        
        await update.message.reply_text(
            "Error al crear comentario. Intenta de nuevo.",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return VER_COMENTARIOS
    
    # Confirmación y volver a ver comentarios
    await update.message.reply_text("Comentario creado correctamente.")
    return await ver_comentarios(update, context)

async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancelar la conversación y volver al inicio."""
    await update.message.reply_text(
        "Operación cancelada. Teclea /start para comenzar de nuevo.",
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END

# Funciones para crear nueva tarea
async def iniciar_creacion_tarea(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Iniciar el proceso de creación de una nueva tarea."""
    # Inicializar el diccionario para almacenar datos de la nueva tarea
    context.user_data["nueva_tarea"] = {}
    
    await update.message.reply_text(
        "Vamos a crear una nueva tarea. Por favor, ingresa el título de la tarea:\n\n"
        "Puedes escribir 'cancelar' en cualquier momento para abortar la creación."
    )
    return CREAR_TAREA_TITULO

async def crear_tarea_titulo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar el título de la nueva tarea."""
    texto = update.message.text
    
    if texto.lower() == "cancelar":
        await update.message.reply_text(
            "Creación de tarea cancelada.",
            reply_markup=ReplyKeyboardMarkup(
                [
                    ["Listar mis tareas"],
                    ["Crear nueva tarea"],
                    ["Seleccionar usuario"],
                    ["Salir"]
                ],
                resize_keyboard=True,
            ),
        )
        return MENU_PRINCIPAL
    
    # Guardar el título
    context.user_data["nueva_tarea"]["title"] = texto
    
    await update.message.reply_text(
        "Título guardado. Ahora, ingresa una descripción para la tarea:\n\n"
        "Puedes escribir 'saltar' para dejar la descripción en blanco."
    )
    return CREAR_TAREA_DESCRIPCION

async def crear_tarea_descripcion(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar la descripción de la nueva tarea."""
    texto = update.message.text
    
    if texto.lower() == "cancelar":
        await update.message.reply_text(
            "Creación de tarea cancelada.",
            reply_markup=ReplyKeyboardMarkup(
                [
                    ["Listar mis tareas"],
                    ["Crear nueva tarea"],
                    ["Seleccionar usuario"],
                    ["Salir"]
                ],
                resize_keyboard=True,
            ),
        )
        return MENU_PRINCIPAL
    
    # Guardar la descripción
    if texto.lower() != "saltar":
        context.user_data["nueva_tarea"]["description"] = texto
    else:
        context.user_data["nueva_tarea"]["description"] = ""
    
    # Seleccionar tag
    keyboard = [
        [InlineKeyboardButton("Feature", callback_data="newtask_tag_Feature")],
        [InlineKeyboardButton("Issue", callback_data="newtask_tag_Issue")],
    ]
    
    await update.message.reply_text(
        "Descripción guardada. Selecciona el tag para esta tarea:",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return CREAR_TAREA_TAG

async def crear_tarea_tag(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar la selección de tag para la nueva tarea."""
    query = update.callback_query
    await query.answer()
    
    tag = query.data.split("_")[2]
    context.user_data["nueva_tarea"]["tag"] = tag
    
    await query.edit_message_text(f"Tag seleccionado: {tag}\n\n"
        "Ahora, ingresa las fechas de inicio y fin (opcional) en formato YYYY-MM-DD:\n\n"
        "Ejemplo:\n"
        "Inicio: 2025-03-10\n"
        "Fin: 2025-03-20\n\n"
        "La fecha de fin es opcional. Si solo ingresas 'Inicio:', se dejará la fecha de fin vacía."
    )
    return CREAR_TAREA_FECHAS

async def crear_tarea_fechas(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar las fechas de la nueva tarea."""
    texto = update.message.text
    
    if texto.lower() == "cancelar":
        await update.message.reply_text(
            "Creación de tarea cancelada.",
            reply_markup=ReplyKeyboardMarkup(
                [
                    ["Listar mis tareas"],
                    ["Crear nueva tarea"],
                    ["Seleccionar usuario"],
                    ["Salir"]
                ],
                resize_keyboard=True,
            ),
        )
        return MENU_PRINCIPAL
    
    # Procesar fechas
    fecha_inicio = None
    fecha_fin = None
    
    for linea in texto.split("\n"):
        if "inicio:" in linea.lower():
            try:
                fecha = linea.split(":", 1)[1].strip()
                # Validar formato de fecha
                datetime.strptime(fecha, "%Y-%m-%d")
                fecha_inicio = fecha
            except (ValueError, IndexError):
                await update.message.reply_text(
                    "Formato de fecha de inicio incorrecto. Usa YYYY-MM-DD.\n"
                    "Por favor, ingresa las fechas nuevamente."
                )
                return CREAR_TAREA_FECHAS
        
        elif "fin:" in linea.lower():
            try:
                fecha = linea.split(":", 1)[1].strip()
                if fecha:  # Si hay una fecha
                    # Validar formato de fecha
                    datetime.strptime(fecha, "%Y-%m-%d")
                    fecha_fin = fecha
            except (ValueError, IndexError):
                await update.message.reply_text(
                    "Formato de fecha de fin incorrecto. Usa YYYY-MM-DD.\n"
                    "Por favor, ingresa las fechas nuevamente."
                )
                return CREAR_TAREA_FECHAS
    
    if not fecha_inicio:
        # Si no se proporcionó fecha de inicio, usar la fecha actual
        fecha_inicio = datetime.now().strftime("%Y-%m-%d")
        await update.message.reply_text(
            f"No se detectó fecha de inicio. Se usará la fecha actual: {fecha_inicio}"
        )
    
    # Guardar fechas
    context.user_data["nueva_tarea"]["startDate"] = fecha_inicio
    if fecha_fin:
        context.user_data["nueva_tarea"]["endDate"] = fecha_fin
    
    # Obtener usuarios del equipo para asignar la tarea
    user = context.user_data["current_user"]
    usuarios = []
    
    if user.get("team"):
        team_id = user["team"]["id"]
        team_info = api_request(f"teams/{team_id}")
        if "error" not in team_info and "members" in team_info:
            usuarios = team_info["members"]
    
    if not usuarios:
        # Si no hay usuarios en el equipo, usar todos los usuarios
        todos_usuarios = api_request("users/")
        if "error" not in todos_usuarios:
            usuarios = [{"id": u["id"], "nombre": u["nombre"]} for u in todos_usuarios]
    
    # Preparar teclado para selección de asignados
    keyboard = []
    for usuario in usuarios:
        keyboard.append([
            InlineKeyboardButton(
                usuario["nombre"],
                callback_data=f"newtask_assign_{usuario['id']}"
            )
        ])
    
    # Añadir opción para finalizar asignación
    keyboard.append([InlineKeyboardButton("✅ Finalizar asignación", callback_data="newtask_assign_done")])
    
    # Inicializar lista de asignados
    context.user_data["asignados"] = []
    context.user_data["asignados_nombres"] = []
    
    await update.message.reply_text(
        "Fechas guardadas. Selecciona usuarios para asignar a esta tarea:\n\n"
        "Puedes seleccionar múltiples usuarios. Cuando termines, selecciona 'Finalizar asignación'.",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return CREAR_TAREA_ASIGNAR

async def crear_tarea_asignar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Procesar la asignación de usuarios a la nueva tarea."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "newtask_assign_done":
        # Finalizar asignación y crear la tarea
        return await finalizar_creacion_tarea(update, context)
    
    # Obtener el ID del usuario seleccionado
    user_id = int(query.data.split("_")[2])
    
    # Verificar si ya está en la lista de asignados
    if user_id in context.user_data["asignados"]:
        # Quitar de la lista
        context.user_data["asignados"].remove(user_id)
        
        # Actualizar nombres
        for i, nombre in enumerate(context.user_data["asignados_nombres"]):
            if nombre.endswith(f"(ID: {user_id})"):
                context.user_data["asignados_nombres"].pop(i)
                break
    else:
        # Añadir a la lista
        context.user_data["asignados"].append(user_id)
        
        # Obtener nombre del usuario
        user_info = api_request(f"users/{user_id}")
        if "error" not in user_info:
            nombre = f"{user_info['nombre']} (ID: {user_id})"
            context.user_data["asignados_nombres"].append(nombre)
    
    # Mostrar lista actual de asignados
    asignados_texto = "\n".join([f"- {nombre}" for nombre in context.user_data["asignados_nombres"]])
    mensaje = "Usuarios asignados actualmente:\n"
    mensaje += asignados_texto if asignados_texto else "Ninguno"
    mensaje += "\n\nSelecciona más usuarios o finaliza la asignación:"
    
    # Regenerar el teclado
    user = context.user_data["current_user"]
    usuarios = []
    
    if user.get("team"):
        team_id = user["team"]["id"]
        team_info = api_request(f"teams/{team_id}")
        if "error" not in team_info and "members" in team_info:
            usuarios = team_info["members"]
    
    if not usuarios:
        todos_usuarios = api_request("users/")
        if "error" not in todos_usuarios:
            usuarios = [{"id": u["id"], "nombre": u["nombre"]} for u in todos_usuarios]
    
    keyboard = []
    for usuario in usuarios:
        # Marcar con ✓ si ya está seleccionado
        nombre = usuario["nombre"]
        if usuario["id"] in context.user_data["asignados"]:
            nombre = f"✓ {nombre}"
        
        keyboard.append([
            InlineKeyboardButton(
                nombre,
                callback_data=f"newtask_assign_{usuario['id']}"
            )
        ])
    
    keyboard.append([InlineKeyboardButton("✅ Finalizar asignación", callback_data="newtask_assign_done")])
    
    await query.edit_message_text(
        mensaje,
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return CREAR_TAREA_ASIGNAR

async def finalizar_creacion_tarea(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Finalizar la creación de la tarea y enviarla a la API."""
    query = update.callback_query
    
    # Preparar datos de la tarea
    tarea_data = context.user_data["nueva_tarea"]
    tarea_data["status"] = "Backlog"  # Estado inicial
    tarea_data["created_by_id"] = context.user_data["current_user"]["id"]
    
    # Si hay un equipo, asignar la tarea al equipo
    if context.user_data["current_user"].get("team"):
        tarea_data["team_id"] = context.user_data["current_user"]["team"]["id"]
    
    # Asignar usuarios
    tarea_data["assignee_ids"] = context.user_data["asignados"]
    
    # Crear la tarea
    response = api_request("tasks/", method="POST", data=tarea_data)
    
    if "error" in response:
        await query.edit_message_text(f"Error al crear la tarea: {response['error']}")
        
        # Volver al menú principal
        await query.message.reply_text(
            "Volviendo al menú principal.",
            reply_markup=ReplyKeyboardMarkup(
                [
                    ["Listar mis tareas"],
                    ["Crear nueva tarea"],
                    ["Seleccionar usuario"],
                    ["Salir"]
                ],
                resize_keyboard=True,
            ),
        )
        return MENU_PRINCIPAL
    
    # Mostrar confirmación
    await query.edit_message_text(
        f"✅ Tarea creada exitosamente:\n\n"
        f"Título: {tarea_data['title']}\n"
        f"Tag: {tarea_data['tag']}\n"
        f"Inicio: {tarea_data['startDate']}\n"
        f"Fin: {tarea_data.get('endDate', 'No definido')}\n"
        f"Asignada a: {len(context.user_data['asignados'])} usuario(s)"
    )
    
    # Volver al menú principal
    await query.message.reply_text(
        "¿Qué deseas hacer ahora?",
        reply_markup=ReplyKeyboardMarkup(
            [
                ["Listar mis tareas"],
                ["Crear nueva tarea"],
                ["Seleccionar usuario"],
                ["Salir"]
            ],
            resize_keyboard=True,
        ),
    )
    return MENU_PRINCIPAL

def main() -> None:
    """Iniciar el bot."""
    # Crear la aplicación y pasar el token del bot
    application = Application.builder().token(os.environ.get("TELEGRAM_BOT_TOKEN")).build()
    
    # Definir el manejador de conversación principal
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            MENU_PRINCIPAL: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, menu_principal),
            ],
            SELECCION_USUARIO: [
                CallbackQueryHandler(seleccionar_usuario, pattern=r"^user_\d+$"),
            ],
            LISTA_TAREAS: [
                CallbackQueryHandler(seleccionar_tarea, pattern=r"^task_\d+$"),
                CallbackQueryHandler(navegacion_tareas, pattern=r"^(next_tasks|prev_tasks|back_to_menu)$"),
            ],
            MENU_TAREA: [
                CallbackQueryHandler(menu_tarea),
            ],
            CAMBIAR_ESTATUS: [
                CallbackQueryHandler(cambiar_estatus),
            ],
            CAMBIAR_TAG: [
                CallbackQueryHandler(cambiar_tag),
            ],
            EDITAR_NOMBRE: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, editar_nombre),
            ],
            EDITAR_FECHAS: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, editar_fechas),
            ],
            VER_COMENTARIOS: [
                CallbackQueryHandler(crear_comentario, pattern=r"^create_comment$"),
                CallbackQueryHandler(menu_tarea, pattern=r"^back_to_task_menu$"),
            ],
            CREAR_COMENTARIO: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_comentario),
            ],
            CREAR_TAREA_TITULO: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, crear_tarea_titulo),
            ],
            CREAR_TAREA_DESCRIPCION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, crear_tarea_descripcion),
            ],
            CREAR_TAREA_TAG: [
                CallbackQueryHandler(crear_tarea_tag, pattern=r"^newtask_tag_"),
            ],
            CREAR_TAREA_FECHAS: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, crear_tarea_fechas),
            ],
            CREAR_TAREA_ASIGNAR: [
                CallbackQueryHandler(crear_tarea_asignar, pattern=r"^newtask_assign_"),
            ],
        },
        fallbacks=[CommandHandler("cancel", cancelar)],
        name="task_management_bot",
        persistent=False,
    )
    
    # Añadir el manejador de conversación a la aplicación
    application.add_handler(conv_handler)
    
    # Iniciar el bot
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()