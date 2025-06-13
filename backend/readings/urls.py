# readings/urls.py

from django.urls import path
from .views import (
    CustomAuthToken,
    register_user,
    dashboard_data,
    SessionListCreateAPIView,
    SessionRetrieveUpdateAPIView,
)

urlpatterns = [
    # Token authentication (your custom view)
    path('token-auth/', CustomAuthToken.as_view(), name='token_auth'),

    # User registration
    path('register/', register_user, name='register_user'),

    # Dashboard data
    path('dashboard-data/', dashboard_data, name='dashboard_data'),

    # List & create meter‐reading sessions
    path('sessions/', SessionListCreateAPIView.as_view(), name='session_list_create'),

    # Retrieve & append readings to a specific session
    path('sessions/<int:pk>/', SessionRetrieveUpdateAPIView.as_view(), name='session_detail'),
]
