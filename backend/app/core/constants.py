from decimal import Decimal

# Token değeri
TOKEN_VALUE_USD = Decimal('1.00')

# Veri fiyatları (Token cinsinden)
PRICES = {
    'psychometric_data': Decimal('1.40'),  # Crystal Knows verisi
    'email': Decimal('0.40'),             # Email bilgisi
    'mobile': Decimal('1.50'),            # Mobil telefon
    'telephone': Decimal('0.10'),         # Sabit telefon
    'linkedin': Decimal('0.20'),          # LinkedIn profili
    'unique_lead_id': Decimal('0.50'),    # Benzersiz lead ID
}

# Public (ücretsiz) veri alanları
PUBLIC_FIELDS = {
    'lead': [
        'id',
        'firstname',
        'lastname',
        'company',
        'job_title',
        'location',
        'sector',
        'created_at',
        'updated_at',
        'source',
        'status'
    ]
}

# Satın alınabilir veri alanları
PURCHASABLE_FIELDS = {
    'email': [
        'email',
        'email_status',
        'email_type'
    ],
    'mobile': [
        'mobile',
        'mobile_status',
        'mobile_type',
        'mobile_country'
    ],
    'telephone': [
        'telephone',
        'telephone_status',
        'telephone_type',
        'telephone_country'
    ],
    'linkedin': [
        'linkedin_url',
        'linkedin_profile_id',
        'linkedin_connections',
        'linkedin_company'
    ],
    'unique_lead_id': [
        'unique_lead_id',
        'lead_source_id',
        'lead_platform',
        'lead_origin'
    ],
    'psychometric_data': [
        'personality_type',
        'communication_style',
        'decision_making',
        'leadership_style',
        'motivation_factors',
        'work_preferences',
        'team_dynamics',
        'strengths',
        'challenges'
    ]
}

# Crystal Knows API ayarları
CRYSTAL_KNOWS = {
    'API_KEY': 'e12e528114b0b563eafdebd0327a53de',
    'BASE_URL': 'https://api.crystalknows.com/v1',
    'ENDPOINTS': {
        'personality': '/personalities/find',
        'recommendations': '/recommendations',
        'communication': '/communication-advice'
    }
}
