-- Connect as TODOUSER
-- ALTER SESSION SET CURRENT_SCHEMA = TODOUSER;

-- SPRINTS TABLE
-- Per team, with start date and end date
CREATE TABLE TODOUSER.SPRINTS (
    ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    TEAM_ID NUMBER NOT NULL,
    START_DATE DATE NOT NULL,
    END_DATE DATE NOT NULL,
    CONSTRAINT FK_SPRINT_TEAM FOREIGN KEY (TEAM_ID) REFERENCES TODOUSER.TEAMS(ID)
);

-- Teams
CREATE TABLE TODOUSER.TEAMS (
    ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    NAME VARCHAR2(255) NOT NULL,
    DESCRIPTION VARCHAR2(2000),
    CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Users
CREATE TABLE TODOUSER.USERS (
    ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    NAME VARCHAR2(255) NOT NULL,
    EMAIL VARCHAR2(255) NOT NULL UNIQUE,
    PASSWORD VARCHAR2(255) NOT NULL,
    ROLE VARCHAR2(20) NOT NULL,
    TELEGRAMID VARCHAR2(255),
    CHATID VARCHAR2(255),
    CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP,
    TEAM_ID NUMBER,
    TEAM_ROLE VARCHAR2(50),
    CONSTRAINT FK_USER_TEAM FOREIGN KEY (TEAM_ID) REFERENCES TODOUSER.TEAMS(ID)
);

-- Tasks
CREATE TABLE TODOUSER.TASKS (
    ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    TITLE VARCHAR2(255) NOT NULL,
    DESCRIPTION CLOB,
    TAG VARCHAR2(50) NOT NULL,
    STATUS VARCHAR2(50) DEFAULT 'Backlog' NOT NULL,
    START_DATE VARCHAR2(50) NOT NULL,
    END_DATE VARCHAR2(50),
    CREATED_BY_ID NUMBER NOT NULL,
    TEAM_ID NUMBER,
    CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT FK_TASK_CREATOR FOREIGN KEY (CREATED_BY_ID) REFERENCES TODOUSER.USERS(ID),
    CONSTRAINT FK_TASK_TEAM FOREIGN KEY (TEAM_ID) REFERENCES TODOUSER.TEAMS(ID),
    CONSTRAINT CHK_TASK_STATUS CHECK (STATUS IN ('Backlog', 'En progreso', 'Completada', 'Cancelada'))
);

-- Comments
CREATE TABLE TODOUSER.COMMENTS (
    ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    TASK_ID NUMBER NOT NULL,
    CONTENT CLOB NOT NULL,
    CREATED_BY_ID NUMBER NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT FK_COMMENT_TASK FOREIGN KEY (TASK_ID) REFERENCES TODOUSER.TASKS(ID) ON DELETE CASCADE,
    CONSTRAINT FK_COMMENT_CREATOR FOREIGN KEY (CREATED_BY_ID) REFERENCES TODOUSER.USERS(ID)
);

-- Task Assignees (junction table)
CREATE TABLE TODOUSER.TASK_ASSIGNEE (
    TASK_ID NUMBER,
    USER_ID NUMBER,
    PRIMARY KEY (TASK_ID, USER_ID),
    CONSTRAINT FK_ASSIGNEE_TASK FOREIGN KEY (TASK_ID) REFERENCES TODOUSER.TASKS(ID) ON DELETE CASCADE,
    CONSTRAINT FK_ASSIGNEE_USER FOREIGN KEY (USER_ID) REFERENCES TODOUSER.USERS(ID)
);

-- Indexes for performance?? (optional)
CREATE INDEX TODOUSER.IDX_USER_TEAM ON TODOUSER.USERS(TEAM_ID);
CREATE INDEX TODOUSER.IDX_TASK_CREATOR ON TODOUSER.TASKS(CREATED_BY_ID);
CREATE INDEX TODOUSER.IDX_TASK_TEAM ON TODOUSER.TASKS(TEAM_ID);
CREATE INDEX TODOUSER.IDX_COMMENT_TASK ON TODOUSER.COMMENTS(TASK_ID);
CREATE INDEX TODOUSER.IDX_COMMENT_CREATOR ON TODOUSER.COMMENTS(CREATED_BY_ID);

-- Insert default data
-- Teams
INSERT INTO TODOUSER.TEAMS (NAME, DESCRIPTION) VALUES ('Equipo Frontend', 'Equipo de desarrollo frontend');
INSERT INTO TODOUSER.TEAMS (NAME, DESCRIPTION) VALUES ('Equipo Backend', 'Equipo de desarrollo backend');

-- Users
INSERT INTO TODOUSER.USERS (NAME, EMAIL, PASSWORD, ROLE, TELEGRAMID)
VALUES ('Manager User', 'manager@example.com', 'manager123', 'manager', 'manager_telegram');

-- Get the IDs of the inserted teams
DECLARE
    v_frontend_team_id NUMBER;
    v_backend_team_id NUMBER;
BEGIN
    SELECT ID INTO v_frontend_team_id FROM TODOUSER.TEAMS WHERE NAME = 'Equipo Frontend';
    SELECT ID INTO v_backend_team_id FROM TODOUSER.TEAMS WHERE NAME = 'Equipo Backend';

    -- Insert developers with team assignments
    INSERT INTO TODOUSER.USERS (NAME, EMAIL, PASSWORD, ROLE, TELEGRAMID, TEAM_ID, TEAM_ROLE)
    VALUES ('Dev One', 'dev1@example.com', 'dev123', 'developer', 'dev1_telegram', v_frontend_team_id, 'lead');

    INSERT INTO TODOUSER.USERS (NAME, EMAIL, PASSWORD, ROLE, TELEGRAMID, TEAM_ID, TEAM_ROLE)
    VALUES ('Dev Two', 'dev2@example.com', 'dev123', 'developer', 'dev2_telegram', v_frontend_team_id, 'member');

    INSERT INTO TODOUSER.USERS (NAME, EMAIL, PASSWORD, ROLE, TELEGRAMID, TEAM_ID, TEAM_ROLE)
    VALUES ('Dev Three', 'dev3@example.com', 'dev123', 'developer', 'dev3_telegram', v_backend_team_id, 'lead');

    INSERT INTO TODOUSER.USERS (NAME, EMAIL, PASSWORD, ROLE, TELEGRAMID, TEAM_ID, TEAM_ROLE)
    VALUES ('Dev Four', 'dev4@example.com', 'dev123', 'developer', 'dev4_telegram', v_backend_team_id, 'member');
END;
/

-- Add some sample tasks
DECLARE
    v_manager_id NUMBER;
    v_frontend_team_id NUMBER;
    v_backend_team_id NUMBER;
    v_dev1_id NUMBER;
    v_dev2_id NUMBER;
    v_dev3_id NUMBER;
    v_task1_id NUMBER;
    v_task2_id NUMBER;
BEGIN
    SELECT ID INTO v_manager_id FROM TODOUSER.USERS WHERE EMAIL = 'manager@example.com';
    SELECT ID INTO v_frontend_team_id FROM TODOUSER.TEAMS WHERE NAME = 'Equipo Frontend';
    SELECT ID INTO v_backend_team_id FROM TODOUSER.TEAMS WHERE NAME = 'Equipo Backend';
    SELECT ID INTO v_dev1_id FROM TODOUSER.USERS WHERE EMAIL = 'dev1@example.com';
    SELECT ID INTO v_dev2_id FROM TODOUSER.USERS WHERE EMAIL = 'dev2@example.com';
    SELECT ID INTO v_dev3_id FROM TODOUSER.USERS WHERE EMAIL = 'dev3@example.com';

    -- Insert frontend task
    INSERT INTO TODOUSER.TASKS (TITLE, DESCRIPTION, TAG, STATUS, START_DATE, END_DATE, CREATED_BY_ID, TEAM_ID)
    VALUES ('Implementar login', 'Crear formulario y lógica de autenticación', 'feature', 'En progreso', '2025-03-01', '2025-03-15', v_manager_id, v_frontend_team_id)
    RETURNING ID INTO v_task1_id;

    -- Insert backend task
    INSERT INTO TODOUSER.TASKS (TITLE, DESCRIPTION, TAG, STATUS, START_DATE, END_DATE, CREATED_BY_ID, TEAM_ID)
    VALUES ('API de usuarios', 'Implementar endpoints REST para usuarios', 'feature', 'Backlog', '2025-03-05', '2025-03-20', v_manager_id, v_backend_team_id)
    RETURNING ID INTO v_task2_id;

    -- Assign tasks to users
    INSERT INTO TODOUSER.TASK_ASSIGNEE (TASK_ID, USER_ID) VALUES (v_task1_id, v_dev1_id);
    INSERT INTO TODOUSER.TASK_ASSIGNEE (TASK_ID, USER_ID) VALUES (v_task1_id, v_dev2_id);
    INSERT INTO TODOUSER.TASK_ASSIGNEE (TASK_ID, USER_ID) VALUES (v_task2_id, v_dev3_id);

    -- Add some comments
    INSERT INTO TODOUSER.COMMENTS (TASK_ID, CONTENT, CREATED_BY_ID)
    VALUES (v_task1_id, 'Estoy trabajando en la validación del formulario', v_dev1_id);

    INSERT INTO TODOUSER.COMMENTS (TASK_ID, CONTENT, CREATED_BY_ID)
    VALUES (v_task1_id, 'Revisen por favor los estilos del formulario', v_dev2_id);

    INSERT INTO TODOUSER.COMMENTS (TASK_ID, CONTENT, CREATED_BY_ID)
    VALUES (v_task2_id, 'Iniciando el diseño de la API', v_dev3_id);
END;
/

COMMIT;

-- Verify table creation
SELECT table_name FROM user_tables ORDER BY table_name;

-- Verify data insertion
SELECT 'Teams: ' || COUNT(*) AS count FROM TODOUSER.TEAMS;
SELECT 'Users: ' || COUNT(*) AS count FROM TODOUSER.USERS;
SELECT 'Tasks: ' || COUNT(*) AS count FROM TODOUSER.TASKS;
SELECT 'Comments: ' || COUNT(*) AS count FROM TODOUSER.COMMENTS;
SELECT 'Task Assignments: ' || COUNT(*) AS count FROM TODOUSER.TASK_ASSIGNEE;

-- Final success message
SELECT 'Database setup complete' AS STATUS FROM DUAL;
