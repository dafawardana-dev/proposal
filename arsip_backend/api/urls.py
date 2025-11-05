from django.urls import path
from rest_framework.authtoken import views as auth_views
from . import views

urlpatterns = [
    
    path('auth/login/', auth_views.obtain_auth_token, name='login'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/me/', views.me, name='user-me'),
        
    path('divisions/', views.DivisionListView.as_view(), name='division-list'),
    path('divisions/<int:pk>/', views.DivisionDetailView.as_view(), name='division-detail'),    

    path('permissions/', views.PermissionListView.as_view(), name='permission-list'),
    
    path('roles/', views.RoleListView.as_view(), name='role-list'),
    path('roles/<int:pk>/', views.RoleDetailView.as_view(), name='role-detail'),

    path('religions/', views.ReligionListCreateView.as_view(), name='religion-list-create'),
    path('religions/<int:pk>/', views.ReligionRetrieveUpdateDestroyView.as_view(), name='religion-detail'),

    path('wilayah/', views.WilayahListView.as_view(), name='wilayah-list'),
    path('wilayah/list/', views.WilayahApiListView.as_view(), name='wilayah-list'),   
    path('wilayah/<int:pk>/', views.WilayahDetailView.as_view(), name='wilayah-detail'), 
        
    path('konsentrasi-utama/', views.KonsentrasiUtamaViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('konsentrasi-utama/upload/', views.KonsentrasiUtamaViewSet.as_view({'post': 'upload'})),
    
    path('konsentrasi-utama/<int:pk>/', views.KonsentrasiUtamaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='konsentrasi-utama-detail'),    

    path('education-levels/', views.EducationLevelListView.as_view(), name='education-level-list'),
    path('education-levels/<int:pk>/', views.EducationLevelDetailView.as_view(), name='education-level-detail'),
    
    path('prodis/', views.ProdiViewSet.as_view({'get': 'list', 'post': 'create'}), name='prodi-list'),
    path('prodis/<int:pk>/', views.ProdiViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='prodi-detail'),
    path('prodis/upload/', views.ProdiViewSet.as_view({'post': 'upload'}), name='prodi-upload'),   

    path('mahasiswa/', views.MahasiswaViewSet.as_view({'get': 'list', 'post': 'create'}), name='mahasiswa-list'),
    path('mahasiswa/<int:pk>/', views.MahasiswaViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='mahasiswa-detail'),
    path('mahasiswa/upload/', views.MahasiswaViewSet.as_view({'post': 'upload'}), name='mahasiswa-upload'),
    
    path('dosen/', views.DosenViewSet.as_view({'get': 'list', 'post': 'create'}), name='dosen-list'),
    path('dosen/<int:pk>/', views.DosenViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='dosen-detail'),
    path('dosen/upload/', views.DosenViewSet.as_view({'post': 'upload'}), name='dosen-upload'),
    
    path('proposals/', views.ProposalViewSet.as_view({'get': 'list', 'post': 'create'}), name='proposal-list'),
    path('proposals/<int:pk>/', views.ProposalViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='proposal-detail'),
    path('proposals/<int:pk>/approve/', views.ProposalViewSet.as_view({'post': 'approve'}), name='proposal-approve'),
    path('proposals/<int:pk>/reject/', views.ProposalViewSet.as_view({'post': 'reject'}), name='proposal-reject'),
    
    path('bimbingan/', views.BimbinganViewSet.as_view({'get': 'list', 'post': 'create'}), name='bimbingan-list'),
    path('bimbingan/<int:pk>/', views.BimbinganViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='bimbingan-detail'),
    
    path('prodis/dropdown/', views.ProdiViewSet.as_view({'get': 'dropdown'}), name='prodi-dropdown'),
    path('konsentrasi-utama/dropdown/', views.KonsentrasiUtamaViewSet.as_view({'get': 'dropdown'}), name='konsentrasi-utama-dropdown'),        
    path('konsentrasi-utama/prodi/<int:prodi_id>/', views.konsentrasi_by_prodi, name='konsentrasi_by_prodi'),

    path('register-mahasiswa/', views.RegisterMahasiswaView.as_view(), name='register-mahasiswa'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
]