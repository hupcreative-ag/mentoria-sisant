// auth.js - Gerenciamento de Login, Cadastro, Recuperação e Redefinição de Senha
import { supabase } from './supabase.js';

// DOM Elements
const alertContainer = document.getElementById('alert-container');
const alertIcon = document.getElementById('alert-icon');
const alertMessage = document.getElementById('alert-message');

const authTabs = document.getElementById('auth-tabs');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formRecovery = document.getElementById('form-recovery');
const formResetPassword = document.getElementById('form-reset-password');

const btnGotoRecovery = document.getElementById('btn-goto-recovery');
const btnRecoveryBack = document.getElementById('btn-recovery-back');

// Check user session. If already logged in, redirect to perfil.html
async function checkActiveSession() {
  const { data: { session } } = await supabase.auth.getSession();
  
  // Se houver sessão ativa e não estivermos em fluxo de redefinição de senha
  if (session && !window.location.hash.includes('type=recovery') && !window.location.search.includes('type=recovery')) {
    window.location.href = './perfil.html';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkActiveSession();
  setupEventListeners();
  setupAuthListeners();
});

// Setup Alert Messages
function showAlert(message, type = 'error') {
  alertContainer.classList.remove('hidden', 'bg-red-50', 'border-red-200', 'text-red-800', 'bg-green-50', 'border-green-200', 'text-green-800', 'bg-blue-50', 'border-blue-200', 'text-blue-800');
  
  if (type === 'error') {
    alertContainer.classList.add('bg-red-50', 'border-red-200', 'text-red-800');
    alertIcon.className = 'ph-bold ph-warning-circle text-red-600 text-lg mt-0.5';
  } else if (type === 'success') {
    alertContainer.classList.add('bg-green-50', 'border-green-200', 'text-green-800');
    alertIcon.className = 'ph-bold ph-check-circle text-green-600 text-lg mt-0.5';
  } else {
    alertContainer.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-800');
    alertIcon.className = 'ph-bold ph-info text-blue-600 text-lg mt-0.5';
  }
  
  alertMessage.innerText = message;
  alertContainer.classList.remove('hidden');
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  alertContainer.classList.add('hidden');
}

// Toggle password visibility
function setupPasswordToggles() {
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

// Event Listeners for Forms and UI
function setupEventListeners() {
  setupPasswordToggles();

  // Tab switching
  tabLogin.addEventListener('click', () => {
    switchTab('login');
  });

  tabRegister.addEventListener('click', () => {
    switchTab('register');
  });

  // Navigation between login and recovery
  btnGotoRecovery.addEventListener('click', () => {
    switchTab('recovery');
  });

  btnRecoveryBack.addEventListener('click', () => {
    switchTab('login');
  });

  // Login Submit
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login-submit');

    setLoading(btn, true, 'Entrando...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showAlert('Login realizado com sucesso! Redirecionando...', 'success');
      setTimeout(() => {
        window.location.href = './perfil.html';
      }, 1500);
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
      setLoading(btn, false, 'Acessar Plataforma');
    }
  });

  // Register Submit
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const fullName = document.getElementById('register-name').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    const btn = document.getElementById('btn-register-submit');

    if (password.length < 6) {
      showAlert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('As senhas não coincidem.');
      return;
    }

    setLoading(btn, true, 'Criando conta...');

    try {
      // Registra o usuário com metadados adicionais
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
          // Redirecionamento após confirmação de email
          emailRedirectTo: window.location.origin + '/auth.html',
        }
      });

      if (error) throw error;

      // Supabase pode requerer confirmação de e-mail por padrão
      const isConfirmEmailRequired = data?.user && data.user.identities && data.user.identities.length > 0 && !data.session;

      if (isConfirmEmailRequired) {
        showAlert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar seu cadastro antes de fazer login.', 'success');
        formRegister.reset();
        setTimeout(() => switchTab('login'), 5000);
      } else {
        showAlert('Cadastro realizado com sucesso! Entrando...', 'success');
        setTimeout(() => {
          window.location.href = './perfil.html';
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Erro ao criar conta. Tente novamente.');
      setLoading(btn, false, 'Criar Minha Conta');
    }
  });

  // Recovery Submit
  formRecovery.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const email = document.getElementById('recovery-email').value.trim();
    const btn = document.getElementById('btn-recovery-submit');

    setLoading(btn, true, 'Enviando link...');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth.html',
      });

      if (error) throw error;

      showAlert('Link de redefinição enviado! Verifique sua caixa de entrada e spam.', 'success');
      formRecovery.reset();
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Erro ao enviar e-mail de recuperação. Tente novamente.');
    } finally {
      setLoading(btn, false, 'Enviar Link de Recuperação');
    }
  });

  // Reset Password Submit
  formResetPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const password = document.getElementById('reset-password').value;
    const confirmPassword = document.getElementById('reset-password-confirm').value;
    const btn = document.getElementById('btn-reset-submit');

    if (password.length < 6) {
      showAlert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('As senhas não coincidem.');
      return;
    }

    setLoading(btn, true, 'Salvando nova senha...');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      showAlert('Senha redefinida com sucesso! Você está logado na plataforma. Redirecionando...', 'success');
      setTimeout(() => {
        window.location.href = './perfil.html';
      }, 2000);
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Erro ao redefinir senha. O link pode ter expirado. Tente solicitar um novo.');
      setLoading(btn, false, 'Atualizar Senha e Entrar');
    }
  });
}

// State changes (Supabase OAuth/Recovery flows)
function setupAuthListeners() {
  // Listen for the recovery auth state event
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      console.log('Evento de recuperação de senha detectado.');
      switchTab('reset-password');
    }
  });
}

// Switch UI State
function switchTab(tab) {
  hideAlert();
  
  // Reset active classes
  tabLogin.classList.remove('border-blue-medium', 'text-blue-medium');
  tabLogin.classList.add('border-transparent', 'text-gray-500');
  tabRegister.classList.remove('border-blue-medium', 'text-blue-medium');
  tabRegister.classList.add('border-transparent', 'text-gray-500');

  // Hide all forms
  formLogin.classList.add('hidden');
  formRegister.classList.add('hidden');
  formRecovery.classList.add('hidden');
  formResetPassword.classList.add('hidden');
  authTabs.classList.remove('hidden');

  if (tab === 'login') {
    tabLogin.classList.add('border-blue-medium', 'text-blue-medium');
    tabLogin.classList.remove('border-transparent', 'text-gray-500');
    formLogin.classList.remove('hidden');
  } else if (tab === 'register') {
    tabRegister.classList.add('border-blue-medium', 'text-blue-medium');
    tabRegister.classList.remove('border-transparent', 'text-gray-500');
    formRegister.classList.remove('hidden');
  } else if (tab === 'recovery') {
    authTabs.classList.add('hidden');
    formRecovery.classList.remove('hidden');
  } else if (tab === 'reset-password') {
    authTabs.classList.add('hidden');
    formResetPassword.classList.remove('hidden');
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
