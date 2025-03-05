- [Endpoints de Identidad](#endpoints-de-identidad)
- [Endpoints de Usuarios](#endpoints-de-usuarios)
- [Endpoints de Equipos](#endpoints-de-equipos)
- [Endpoints de Tareas](#endpoints-de-tareas)
- [Endpoints de Comentarios](#endpoints-de-comentarios)
- [Otros Endpoints](#otros-endpoints)

## Endpoints de Identidad

### Set User Identity
- **Endpoint**: `POST /api/identity/set/{user_id}`
- **Descripción**: Establece la identidad del usuario mediante una cookie
- **Fetch**:
  ```javascript
  fetch('/api/identity/set/1', { method: 'POST' })
  ```
- **Retorno**:
  ```json
  { "message": "Identity set to: Manager User (manager)" }
  ```

### Get Current Identity
- **Endpoint**: `GET /api/identity/current`
- **Descripción**: Obtiene la identidad del usuario actual
- **Fetch**:
  ```javascript
  fetch('/api/identity/current')
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "nombre": "Manager User",
    "email": "manager@example.com",
    "role": "manager",
    "telegramId": "manager_telegram",
    "chatId": null,
    "created_at": "2023-01-01T00:00:00",
    "team": null
  }
  ```

### Clear Identity
- **Endpoint**: `POST /api/identity/clear`
- **Descripción**: Elimina la cookie de identidad
- **Fetch**:
  ```javascript
  fetch('/api/identity/clear', { method: 'POST' })
  ```
- **Retorno**:
  ```json
  { "message": "Identity cleared" }
  ```

## Endpoints de Usuarios

### Create User
- **Endpoint**: `POST /api/users/`
- **Descripción**: Crea un nuevo usuario
- **Fetch**:
  ```javascript
  fetch('/api/users/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: "Nuevo Usuario",
      email: "nuevo@example.com",
      password: "password123",
      role: "developer",
      telegramId: "nuevo_telegram"
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 6,
    "nombre": "Nuevo Usuario",
    "email": "nuevo@example.com",
    "role": "developer",
    "telegramId": "nuevo_telegram",
    "chatId": null,
    "created_at": "2023-01-01T00:00:00",
    "team": null
  }
  ```

### Get Users
- **Endpoint**: `GET /api/users/`
- **Descripción**: Obtiene la lista de usuarios
- **Parámetros**:
  - `skip` (opcional): Número de usuarios a omitir (paginación)
  - `limit` (opcional): Número máximo de usuarios a retornar
- **Fetch**:
  ```javascript
  fetch('/api/users/?skip=0&limit=100')
  ```
- **Retorno**:
  ```json
  [
    {
      "id": 1,
      "nombre": "Manager User",
      "email": "manager@example.com",
      "role": "manager",
      "telegramId": "manager_telegram",
      "chatId": null,
      "created_at": "2023-01-01T00:00:00",
      "team": null
    },
    // más usuarios...
  ]
  ```

### Get User
- **Endpoint**: `GET /api/users/{user_id}`
- **Descripción**: Obtiene la información de un usuario específico
- **Fetch**:
  ```javascript
  fetch('/api/users/1')
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "nombre": "Manager User",
    "email": "manager@example.com",
    "role": "manager",
    "telegramId": "manager_telegram",
    "chatId": null,
    "created_at": "2023-01-01T00:00:00",
    "team": null
  }
  ```

### Update User
- **Endpoint**: `PUT /api/users/{user_id}`
- **Descripción**: Actualiza la información de un usuario
- **Fetch**:
  ```javascript
  fetch('/api/users/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: "Updated Manager",
      telegramId: "updated_telegram"
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "nombre": "Updated Manager",
    "email": "manager@example.com",
    "role": "manager",
    "telegramId": "updated_telegram",
    "chatId": null,
    "created_at": "2023-01-01T00:00:00",
    "team": null
  }
  ```

### Assign User to Team
- **Endpoint**: `PUT /api/users/{user_id}/team`
- **Descripción**: Asigna un usuario a un equipo (requiere ser manager)
- **Fetch**:
  ```javascript
  fetch('/api/users/3/team', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      team_id: 1,
      role: "member"
    })
  })
  ```
- **Retorno**:
  ```json
  { "message": "User Dev Two assigned to team Equipo Frontend as member" }
  ```

### Delete User
- **Endpoint**: `DELETE /api/users/{user_id}`
- **Descripción**: Elimina un usuario
- **Fetch**:
  ```javascript
  fetch('/api/users/6', { method: 'DELETE' })
  ```
- **Retorno**:
  ```json
  { "message": "User deleted" }
  ```

## Endpoints de Equipos

### Create Team
- **Endpoint**: `POST /api/teams/`
- **Descripción**: Crea un nuevo equipo
- **Fetch**:
  ```javascript
  fetch('/api/teams/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: "Equipo QA",
      description: "Equipo de control de calidad"
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 3,
    "nombre": "Equipo QA",
    "description": "Equipo de control de calidad",
    "created_at": "2023-01-01T00:00:00",
    "members": []
  }
  ```

### Get Teams
- **Endpoint**: `GET /api/teams/`
- **Descripción**: Obtiene la lista de equipos
- **Parámetros**:
  - `skip` (opcional): Número de equipos a omitir (paginación)
  - `limit` (opcional): Número máximo de equipos a retornar
- **Fetch**:
  ```javascript
  fetch('/api/teams/?skip=0&limit=100')
  ```
- **Retorno**:
  ```json
  [
    {
      "id": 1,
      "nombre": "Equipo Frontend",
      "description": "Equipo de desarrollo frontend",
      "created_at": "2023-01-01T00:00:00",
      "members": [
        { "id": 2, "nombre": "Dev One", "role": "lead" },
        { "id": 3, "nombre": "Dev Two", "role": "member" }
      ]
    },
    // más equipos...
  ]
  ```

### Get Team
- **Endpoint**: `GET /api/teams/{team_id}`
- **Descripción**: Obtiene información de un equipo específico
- **Fetch**:
  ```javascript
  fetch('/api/teams/1')
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "nombre": "Equipo Frontend",
    "description": "Equipo de desarrollo frontend",
    "created_at": "2023-01-01T00:00:00",
    "members": [
      { "id": 2, "nombre": "Dev One", "role": "lead" },
      { "id": 3, "nombre": "Dev Two", "role": "member" }
    ]
  }
  ```

### Update Team
- **Endpoint**: `PUT /api/teams/{team_id}`
- **Descripción**: Actualiza la información de un equipo
- **Fetch**:
  ```javascript
  fetch('/api/teams/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: "Frontend Team",
      description: "Frontend development team"
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "nombre": "Frontend Team",
    "description": "Frontend development team",
    "created_at": "2023-01-01T00:00:00",
    "members": [
      { "id": 2, "nombre": "Dev One", "role": "lead" },
      { "id": 3, "nombre": "Dev Two", "role": "member" }
    ]
  }
  ```

### Delete Team
- **Endpoint**: `DELETE /api/teams/{team_id}`
- **Descripción**: Elimina un equipo
- **Fetch**:
  ```javascript
  fetch('/api/teams/3', { method: 'DELETE' })
  ```
- **Retorno**:
  ```json
  { "message": "Team deleted" }
  ```

### Get Current User Team
- **Endpoint**: `GET /api/users/me/team`
- **Descripción**: Obtiene información del equipo del usuario actual
- **Fetch**:
  ```javascript
  fetch('/api/users/me/team')
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "nombre": "Equipo Frontend",
    "description": "Equipo de desarrollo frontend",
    "role": "lead"
  }
  ```

## Endpoints de Tareas

### Create Task
- **Endpoint**: `POST /api/tasks/`
- **Descripción**: Crea una nueva tarea
- **Fetch**:
  ```javascript
  fetch('/api/tasks/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: "Implementar función de login",
      description: "Crear formulario y lógica de autenticación",
      tag: "feature",
      status: "Backlog",
      startDate: "2023-01-15",
      endDate: "2023-01-30",
      team_id: 1,
      assignee_ids: [2, 3]
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "title": "Implementar función de login",
    "description": "Crear formulario y lógica de autenticación",
    "tag": "feature",
    "status": "Backlog",
    "startDate": "2023-01-15",
    "endDate": "2023-01-30",
    "created_by": "Manager User",
    "team": "Equipo Frontend",
    "assignees": ["Dev One", "Dev Two"],
    "created_at": "2023-01-01T00:00:00"
  }
  ```

### Get Tasks
- **Endpoint**: `GET /api/tasks/`
- **Descripción**: Obtiene lista de tareas con filtrado
- **Parámetros**:
  - `view_mode` (opcional): "assigned" (mis tareas) o "team" (tareas del equipo)
  - `team_id` (opcional): ID del equipo para filtrar
  - `status` (opcional): Estado de la tarea
  - `tag` (opcional): Etiqueta de la tarea
  - `assigned_to` (opcional): ID del usuario asignado
  - `created_by` (opcional): ID del usuario que creó la tarea
  - `skip` (opcional): Número de tareas a omitir (paginación)
  - `limit` (opcional): Número máximo de tareas a retornar
- **Fetch**:
  ```javascript
  fetch('/api/tasks/?view_mode=team&team_id=1&status=Backlog&tag=feature&skip=0&limit=100')
  ```
- **Retorno**:
  ```json
  [
    {
      "id": 1,
      "title": "Implementar función de login",
      "description": "Crear formulario y lógica de autenticación",
      "tag": "feature",
      "status": "Backlog",
      "startDate": "2023-01-15",
      "endDate": "2023-01-30",
      "created_by": "Manager User",
      "team": "Equipo Frontend",
      "assignees": ["Dev One", "Dev Two"],
      "created_at": "2023-01-01T00:00:00"
    },
    // más tareas...
  ]
  ```

### Get Task
- **Endpoint**: `GET /api/tasks/{task_id}`
- **Descripción**: Obtiene información de una tarea específica
- **Fetch**:
  ```javascript
  fetch('/api/tasks/1')
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "title": "Implementar función de login",
    "description": "Crear formulario y lógica de autenticación",
    "tag": "feature",
    "status": "Backlog",
    "startDate": "2023-01-15",
    "endDate": "2023-01-30",
    "created_by": "Manager User",
    "team": "Equipo Frontend",
    "assignees": ["Dev One", "Dev Two"],
    "created_at": "2023-01-01T00:00:00"
  }
  ```

### Update Task
- **Endpoint**: `PUT /api/tasks/{task_id}`
- **Descripción**: Actualiza la información de una tarea
- **Fetch**:
  ```javascript
  fetch('/api/tasks/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: "Implementar función de login y registro",
      status: "En progreso",
      assignee_ids: [2]
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "title": "Implementar función de login y registro",
    "description": "Crear formulario y lógica de autenticación",
    "tag": "feature",
    "status": "En progreso",
    "startDate": "2023-01-15",
    "endDate": "2023-01-30",
    "created_by": "Manager User",
    "team": "Equipo Frontend",
    "assignees": ["Dev One"],
    "created_at": "2023-01-01T00:00:00"
  }
  ```

### Delete Task
- **Endpoint**: `DELETE /api/tasks/{task_id}`
- **Descripción**: Elimina una tarea
- **Fetch**:
  ```javascript
  fetch('/api/tasks/1', { method: 'DELETE' })
  ```
- **Retorno**:
  ```json
  { "message": "Task deleted" }
  ```

### Update Task Status
- **Endpoint**: `PUT /api/tasks/{task_id}/status`
- **Descripción**: Actualiza solo el estado de una tarea
- **Fetch**:
  ```javascript
  fetch('/api/tasks/1/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: "Completada"
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "title": "Implementar función de login y registro",
    "description": "Crear formulario y lógica de autenticación",
    "tag": "feature",
    "status": "Completada",
    "startDate": "2023-01-15",
    "endDate": "2023-01-30",
    "created_by": "Manager User",
    "team": "Equipo Frontend",
    "assignees": ["Dev One"],
    "created_at": "2023-01-01T00:00:00"
  }
  ```

### Assign Task
- **Endpoint**: `PUT /api/tasks/{task_id}/assign`
- **Descripción**: Asigna usuarios a una tarea
- **Fetch**:
  ```javascript
  fetch('/api/tasks/1/assign', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignee_ids: [2, 3]
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "title": "Implementar función de login y registro",
    "description": "Crear formulario y lógica de autenticación",
    "tag": "feature",
    "status": "Completada",
    "startDate": "2023-01-15",
    "endDate": "2023-01-30",
    "created_by": "Manager User",
    "team": "Equipo Frontend",
    "assignees": ["Dev One", "Dev Two"],
    "created_at": "2023-01-01T00:00:00"
  }
  ```

### Delete Multiple Tasks
- **Endpoint**: `DELETE /api/tasks/`
- **Descripción**: Elimina múltiples tareas
- **Fetch**:
  ```javascript
  fetch('/api/tasks/', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([1, 2, 3])
  })
  ```
- **Retorno**:
  ```json
  { "message": "Tasks deleted" }
  ```

## Endpoints de Comentarios

### Create Comment
- **Endpoint**: `POST /api/tasks/{task_id}/comments`
- **Descripción**: Añade un comentario a una tarea
- **Fetch**:
  ```javascript
  fetch('/api/tasks/1/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: "Trabajando en la autenticación ahora"
    })
  })
  ```
- **Retorno**:
  ```json
  {
    "id": 1,
    "task_id": 1,
    "content": "Trabajando en la autenticación ahora",
    "created_by": "Dev One",
    "created_at": "2023-01-01T00:00:00"
  }
  ```

### Get Comments
- **Endpoint**: `GET /api/tasks/{task_id}/comments`
- **Descripción**: Obtiene los comentarios de una tarea
- **Fetch**:
  ```javascript
  fetch('/api/tasks/1/comments')
  ```
- **Retorno**:
  ```json
  [
    {
      "id": 1,
      "task_id": 1,
      "content": "Trabajando en la autenticación ahora",
      "created_by": "Dev One",
      "created_at": "2023-01-01T00:00:00"
    },
    // más comentarios...
  ]
  ```

### Delete Comment
- **Endpoint**: `DELETE /api/comments/{comment_id}`
- **Descripción**: Elimina un comentario
- **Fetch**:
  ```javascript
  fetch('/api/comments/1', { method: 'DELETE' })
  ```
- **Retorno**:
  ```json
  { "message": "Comment deleted" }
  ```

## Otros Endpoints

### Root
- **Endpoint**: `GET /api/`
- **Descripción**: Endpoint raíz para verificar API
- **Fetch**:
  ```javascript
  fetch('/api/')
  ```
- **Retorno**:
  ```json
  { "message": "Task Management API" }
  ```

### Debug
- **Endpoint**: `GET /api/debug`
- **Descripción**: Endpoint para depuración
- **Fetch**:
  ```javascript
  fetch('/api/debug')
  ```
- **Retorno**:
  ```json
  { "message": "Ok buddy dev" }
  ```

### Health Check
- **Endpoint**: `GET /api/healthcheck`
- **Descripción**: Endpoint para verificar el estado del servicio
- **Fetch**:
  ```javascript
  fetch('/api/healthcheck')
  ```
- **Retorno**: 204 No Content (sin cuerpo de respuesta)

## Notas

### Estados de Tareas
Los estados permitidos para las tareas son:
- `Backlog` (valor por defecto)
- `En progreso`
- `Completada`
- `Cancelada`

### Roles de Usuario
- `manager`: Puede gestionar todos los equipos y tareas
- `developer`: Solo puede gestionar tareas asociadas a su equipo

### Roles en Equipo (hay que cambiar esto, pero es extendible!!)
- `lead`: Líder del equipo
- `member`: Miembro regular del equipo
