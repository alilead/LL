-- 1. Organization oluştur
INSERT INTO organizations (
    name,
    description,
    created_at,
    updated_at
)
VALUES (
    'LeadLab',
    'LeadLab Organization',
    NOW(),
    NOW()
);

-- 2. Admin rolü oluştur
INSERT INTO roles (
    name,
    organization_id,
    description,
    created_at,
    updated_at
)
VALUES (
    'admin',
    LAST_INSERT_ID(),
    'Administrator role with full access',
    NOW(),
    NOW()
);

-- 3. Firat kullanıcısını oluştur
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
    (SELECT id FROM organizations WHERE name = 'LeadLab'),
    'firat@the-leadlab.com',
    '$2b$12$a1oRR8lROWkfR1mGdZBMo.DRJoYlj8tU2O9CwRaz.E1Ifvg9C7pmG',
    'Firat',
    'Celik',
    1,
    1,
    1,
    NOW(),
    NOW()
);

-- Firat için admin rolü ata
INSERT INTO user_roles (
    user_id,
    role_id,
    created_at
)
VALUES (
    LAST_INSERT_ID(),
    (SELECT id FROM roles WHERE name = 'admin'),
    NOW()
);

-- 4. Joshua kullanıcısını oluştur
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
    (SELECT id FROM organizations WHERE name = 'LeadLab'),
    'joshua@the-leadlab.com',
    '$2b$12$Ito2G0Ej6mkknbsOh8vTrevWSf/4N9hb6deRtqIchJI6R0dgfpF..',
    'Joshua',
    'Hatcher',
    1,
    1,
    1,
    NOW(),
    NOW()
);

-- Joshua için admin rolü ata
INSERT INTO user_roles (
    user_id,
    role_id,
    created_at
)
VALUES (
    LAST_INSERT_ID(),
    (SELECT id FROM roles WHERE name = 'admin'),
    NOW()
);
