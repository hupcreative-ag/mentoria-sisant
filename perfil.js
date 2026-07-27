// perfil.js - Gerenciamento de Dados do Usuário e Alteração de Senha
import { supabase } from './supabase.js';

// DOM Elements
const userDisplayName = document.getElementById('user-display-name');
const welcomeTitle = document.getElementById('welcome-title');
const btnLogout = document.getElementById('btn-logout');

const alertContainer = document.getElementById('alert-container');
const alertIcon = document.getElementById('alert-icon');
const alertMessage = document.getElementById('alert-message');

const navBtnData = document.getElementById('nav-btn-data');
const navBtnSecurity = document.getElementById('nav-btn-security');

const sectionData = document.getElementById('section-data');
const sectionSecurity = document.getElementById('section-security');

const formProfileData = document.getElementById('form-profile-data');
const formProfileSecurity = document.getElementById('form-profile-security');

let currentUser = null;

// Initialize and check auth
document.addEventListener('DOMContentLoaded', () => {
  initProfile();
});

async function initProfile() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.log('Nenhuma sessão ativa encontrada. Redirecionando para login.');
    window.location.href = './auth.html';
    return;
  }
  
  currentUser = session.user;
  setupUI();
  setupEventListeners();
  await loadUserProfile();
}

// Setup static triggers
function setupUI() {
  // Toggle password visibility in profile
  const toggleButtons = document.querySelectorAll('.btn-toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const icon = button.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'ph ph-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'ph ph-eye';
      }
    });
  });
}

// Fetch user details from PostgreSQL database profiles table
async function loadUserProfile() {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error) throw error;

    // Populate data
    const name = profile?.full_name || currentUser.user_metadata?.full_name || '';
    const phone = profile?.phone || currentUser.user_metadata?.phone || '';
    const email = profile?.email || currentUser.email || '';

    document.getElementById('profile-name').value = name;
    document.getElementById('profile-phone').value = phone;
    document.getElementById('profile-email').value = email;

    // Update Header / Greetings
    const firstName = name ? name.split(' ')[0] : 'Usuário';
    userDisplayName.innerText = name || email;
    userDisplayName.classList.remove('hidden');
    welcomeTitle.innerText = `Olá, Dr(a). ${firstName}!`;

  } catch (err) {
    console.error('Erro ao carregar dados do perfil:', err);
    showAlert('Não foi possível carregar os dados de perfil do banco de dados.');
  }
}

// Event Listeners
function setupEventListeners() {
  
  // Navigation sidebar
  navBtnData.addEventListener('click', () => {
    switchSection('data');
  });

  navBtnSecurity.addEventListener('click', () => {
    switchSection('security');
  });

  // Logout Click
  btnLogout.addEventListener('click', async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = './auth.html';
    } catch (err) {
      console.error('Erro ao deslogar:', err);
      showAlert('Erro ao deslogar do sistema.');
    }
  });

  // Submit Profile Data Edit Form
  formProfileData.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const fullName = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const btn = document.getElementById('btn-save-data');

    setLoading(btn, true, 'Salvando...');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Opcionalmente atualiza os metadados do auth (para manter consistência local)
      await supabase.auth.updateUser({
        data: { full_name: fullName, phone: phone }
      });

      showAlert('Perfil atualizado com sucesso no banco de dados!', 'success');
      
      // Atualizar interface
      const firstName = fullName.split(' ')[0];
      userDisplayName.innerText = fullName;
      welcomeTitle.innerText = `Olá, Dr(a). ${firstName}!`;
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      showAlert(err.message || 'Ocorreu um erro ao atualizar os dados.');
    } finally {
      setLoading(btn, false, '<i class="ph ph-floppy-disk text-lg"></i> Salvar Alterações');
    }
  });

  // Submit Password Change Form
  formProfileSecurity.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const password = document.getElementById('security-password').value;
    const confirmPassword = document.getElementById('security-password-confirm').value;
    const btn = document.getElementById('btn-save-password');

    if (password.length < 6) {
      showAlert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('As senhas não coincidem.');
      return;
    }

    setLoading(btn, true, 'Atualizando...');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      showAlert('Sua senha de segurança foi atualizada com sucesso!', 'success');
      formProfileSecurity.reset();
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      showAlert(err.message || 'Ocorreu um erro ao atualizar a senha.');
    } finally {
      setLoading(btn, false, '<i class="ph ph-shield-check text-lg"></i> Atualizar Senha');
    }
  });
}

// Alert messaging helper
function showAlert(message, type = 'error') {
  alertContainer.classList.remove('hidden', 'bg-red-50', 'border-red-200', 'text-red-800', 'bg-green-50', 'border-green-200', 'text-green-800');
  
  if (type === 'error') {
    alertContainer.classList.add('bg-red-50', 'border-red-200', 'text-red-800');
    alertIcon.className = 'ph-bold ph-warning-circle text-red-600 text-lg mt-0.5';
  } else {
    alertContainer.classList.add('bg-green-50', 'border-green-200', 'text-green-800');
    alertIcon.className = 'ph-bold ph-check-circle text-green-600 text-lg mt-0.5';
  }
  
  alertMessage.innerText = message;
  alertContainer.classList.remove('hidden');
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  alertContainer.classList.add('hidden');
}

// Toggle display panels
function switchSection(section) {
  hideAlert();
  
  // Navigation styles
  navBtnData.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-gray-500 hover:text-navy hover:bg-gray-50';
  navBtnSecurity.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-gray-500 hover:text-navy hover:bg-gray-50';
  
  sectionData.classList.add('hidden');
  sectionSecurity.classList.add('hidden');

  if (section === 'data') {
    navBtnData.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all bg-blue-medium/10 text-blue-medium';
    sectionData.classList.remove('hidden');
  } else if (section === 'security') {
    navBtnSecurity.className = 'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all bg-blue-medium/10 text-blue-medium';
    sectionSecurity.classList.remove('hidden');
  }
}

// Button loader helper
function setLoading(button, isLoading, text) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<i class="ph ph-spinner animate-spin text-lg mr-2 inline-block align-middle"></i> ${text}`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || text;
  }
}
