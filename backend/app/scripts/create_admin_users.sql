-- 1. Firat kullanıcısını oluştur
INSERT INTO users (
    organization_id, 
    email,
    password_hash,
    first_name,
    last_name,
    is_active,
    is_superuser,
    is_admin,
    created_at,
    updated_at
)
VALUES (
    1,  -- organization_id (varsayılan olarak 1)
    'firat@the-leadlab.com',
    '$2b$12$a1oRR8lROWkfR1mGdZBMo.DRJoYlj8tU2O9CwRaz.E1Ifvg9C7pmG',
    'Firat',
    'Celik',
    1,  -- is_active
    1,  -- is_superuser
    1,  -- is_admin
    NOW(),
    NOW()
);

-- Firat için admin rolü ata
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES (LAST_INSERT_ID(), 1, NOW());

-- 2. Joshua kullanıcısını oluştur
INSERT INTO users (
    organization_id, 
    email,
    password_hash,
    first_name,
    last_name,
    is_active,
    is_superuser,
    is_admin,
    created_at,
    updated_at
)
VALUES (
    1,  -- organization_id (varsayılan olarak 1)
    'joshua@the-leadlab.com',
    '$2b$12$Ito2G0Ej6mkknbsOh8vTrevWSf/4N9hb6deRtqIchJI6R0dgfpF..',
    'Joshua',
    'Hatcher',
    1,  -- is_active
    1,  -- is_superuser
    1,  -- is_admin
    NOW(),
    NOW()
);

-- Joshua için admin rolü ata
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES (LAST_INSERT_ID(), 1, NOW());
