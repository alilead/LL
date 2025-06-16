from sqlalchemy import Column, Integer, String, Text, ARRAY, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class PsychometricData(Base, TimestampMixin):
    __tablename__ = "psychometric_data"

    data_id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.lead_id', ondelete='CASCADE'))
    
    # DISC Profile
    disc_type = Column(String(5))
    disc_d = Column(Integer)
    disc_i = Column(Integer)
    disc_s = Column(Integer)
    disc_c = Column(Integer)
    disc_intensity = Column(Integer)
    
    # Personality Insights
    archetype = Column(String(50))
    myers_briggs_type = Column(String(10))
    overview = Column(ARRAY(Text))
    behavior = Column(ARRAY(Text))
    
    # Business Recommendations
    building_trust = Column(ARRAY(Text))
    driving_action = Column(ARRAY(Text))
    following_up = Column(ARRAY(Text))
    negotiating = Column(ARRAY(Text))
    selling = Column(ARRAY(Text))
    
    # Visual Data
    photo_url = Column(Text)
    disc_map_url = Column(Text)

    # Relationship
    lead = relationship("Lead", back_populates="psychometric_data") 