from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken import views as drf_views
from django.views.generic import TemplateView
from django.conf.urls.static import static
from django.conf import settings
from django.urls import path, include, re_path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('readings.urls')),
    path('api-token-auth/', drf_views.obtain_auth_token),
]

# Catch-all: serve React's index.html for all other paths
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]

# In case you're serving static via Django (WhiteNoise handles this automatically)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)