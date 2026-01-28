-- 1. Organizations tablosuna kayıt ekle
INSERT INTO organizations (
    name,
    description,
    created_at,
    updated_at
)
VALUES (
    'LeadLab',
    'LeadLab Main Organization',
    NOW(),
    NOW()
);

-- 2. Roles tablosuna admin rolü ekle
INSERT INTO roles (
    name,
    organization_id,
    description,
    created_at,
    updated_at
)
VALUES (
    'admin',
    (SELECT id FROM organizations WHERE name = 'LeadLab'),
    'Administrator role with full access',
    NOW(),
    NOW()
);

-- 3. Lead Stages ekle (en azından bir tane)
INSERT INTO lead_stages (
    name,
    description,
    color,
    order_index,
    is_active,
    created_at,
    updated_at,
    organization_id
)
VALUES (
    'New',
    'New leads',
    '#4CAF50',
    1,
    1,
    NOW(),
    NOW(),
    (SELECT id FROM organizations WHERE name = 'LeadLab')
);

-- 4. Firat kullanıcısını oluştur
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
    (SELECT id FROM users WHERE email = 'firat@the-leadlab.com'),
    (SELECT id FROM roles WHERE name = 'admin'),
    NOW()
);

-- 5. Joshua kullanıcısını oluştur
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
    (SELECT id FROM users WHERE email = 'joshua@the-leadlab.com'),
    (SELECT id FROM roles WHERE name = 'admin'),
    NOW()
);
