<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { openCommandPalette } from '$lib/stores/commandPalette';
import { onMount } from 'svelte';

export let data: { user: App.Locals['user']; hasAIProviders: boolean };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export let params: Record<string, string> = {};

let mounted = false;
let toastMessage = '';
let showToast = false;

const errorMessages: Record<string, string> = {
forbidden: 'You do not have permission to access that page.',
unauthorized: 'Please log in to access that page.',
oauth_failed: 'Authentication failed. Please try again.'
};

$: isAdmin = data.user?.isOwner || data.user?.isAdmin;

onMount(() => {
mounted = true;

const errorCode = $page.url.searchParams.get('error');
if (errorCode && errorMessages[errorCode]) {
toastMessage = errorMessages[errorCode];
showToast = true;

const url = new URL(window.location.href);
url.searchParams.delete('error');
window.history.replaceState({}, '', url);

setTimeout(() => {
showToast = false;
}, 5000);
}
});

function dismissToast() {
showToast = false;
}
</script>

<svelte:head>
<title>Nabu</title>
<meta name="description" content="Nabu — Marketing automation platform by Hermes. AI-powered content, campaigns, and more." />
</svelte:head>

<div class="home" class:mounted>
<header class="hero">
<h1 class="title">Nabu</h1>
<p class="subtitle">
Marketing automation platform with AI-powered content, campaign management, and intelligent chat — built for Hermes.

<button
class="search-trigger"
on:click={() => openCommandPalette()}
aria-label="Open command palette"
>
<svg width="16" height="16" viewBox="0 0 20 20" fill="none">
<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" />
<path d="M13 13l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>
<span>Search or jump to&hellip;</span>
<kbd>Ctrl+K</kbd>
</button>
</header>

{#if !data.user}
<section class="section">
<h2 class="section-title">Get Started</h2>
<div class="card-grid cols-3">
<a href="/auth/login" class="nav-card">
<div class="card-icon login-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
<polyline points="10 17 15 12 10 7" />
<line x1="15" y1="12" x2="3" y2="12" />
</svg>
</div>
<h3>Log In</h3>
<p>Sign in with your account</p>
</a>
<a href="/auth/signup" class="nav-card">
<div class="card-icon signup-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
<circle cx="8.5" cy="7" r="4" />
<line x1="20" y1="8" x2="20" y2="14" />
<line x1="23" y1="11" x2="17" y2="11" />
</svg>
</div>
<h3>Sign Up</h3>
<p>Create a new account</p>
</a>
<a href="/documentation" class="nav-card">
<div class="card-icon docs-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
</svg>
</div>
<h3>Documentation</h3>
<p>Features, setup & guides</p>
</a>
</div>
</section>
{/if}

{#if isAdmin}
<section class="section">
<h2 class="section-title">Administration</h2>
<div class="card-grid cols-3">
<a href="/admin" class="nav-card">
<div class="card-icon admin-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="3" width="7" height="7" />
<rect x="14" y="3" width="7" height="7" />
<rect x="14" y="14" width="7" height="7" />
<rect x="3" y="14" width="7" height="7" />
</svg>
</div>
<h3>Dashboard</h3>
<p>System overview & config status</p>
</a>
<a href="/admin/users" class="nav-card">
<div class="card-icon users-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
<circle cx="9" cy="7" r="4" />
<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
<path d="M16 3.13a4 4 0 0 1 0 7.75" />
</svg>
</div>
<h3>Users</h3>
<p>Manage users & invite new members</p>
</a>
<a href="/admin/cms" class="nav-card">
<div class="card-icon cms-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
<polyline points="14 2 14 8 20 8" />
<line x1="16" y1="13" x2="8" y2="13" />
<line x1="16" y1="17" x2="8" y2="17" />
<polyline points="10 9 9 9 8 9" />
</svg>
</div>
<h3>CMS</h3>
<p>Content types & items (CRUD)</p>
</a>
<a href="/admin/ai-keys" class="nav-card">
<div class="card-icon ai-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
<circle cx="12" cy="15" r="2" />
</svg>
</div>
<h3>AI Keys</h3>
<p>API keys, models & voice config</p>
</a>
<a href="/admin/auth-keys" class="nav-card">
<div class="card-icon auth-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
</svg>
</div>
<h3>Auth Keys</h3>
<p>OAuth providers (GitHub, Discord&hellip;)</p>
</a>
<a href="/setup" class="nav-card">
<div class="card-icon setup-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="12" r="3" />
<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
</svg>
</div>
<h3>Setup</h3>
<p>Initial configuration wizard</p>
</a>
</div>
</section>
{/if}

{#if data.user}
<section class="section">
<h2 class="section-title">App</h2>
<div class="card-grid cols-3">
<a href="/chat" class="nav-card">
<div class="card-icon chat-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
</svg>
</div>
<h3>Chat</h3>
<p>AI text & voice conversations</p>
</a>
<a href="/videos" class="nav-card">
<div class="card-icon video-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<polygon points="23 7 16 12 23 17 23 7" />
<rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
</svg>
</div>
<h3>Videos</h3>
<p>Create & manage AI videos</p>
</a>
<a href="/profile" class="nav-card">
<div class="card-icon profile-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
<circle cx="12" cy="7" r="4" />
</svg>
</div>
<h3>Profile</h3>
<p>Your account & connected services</p>
</a>
</div>
</section>

<section class="section">
<h2 class="section-title">Resources</h2>
<div class="card-grid cols-3">
<a href="/documentation" class="nav-card">
<div class="card-icon docs-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
</svg>
</div>
<h3>Documentation</h3>
<p>Features, setup & usage guides</p>
</a>
{#if isAdmin}
<a href="/reset" class="nav-card danger-card">
<div class="card-icon reset-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<polyline points="1 4 1 10 7 10" />
<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
</svg>
</div>
<h3>Factory Reset</h3>
<p>Reset OAuth & config (careful!)</p>
</a>
{/if}
</div>
</section>
{/if}
</div>

{#if showToast}
<div class="toast toast-error" role="alert" aria-live="polite">
<span class="toast-message">{toastMessage}</span>
<button class="toast-dismiss" on:click={dismissToast} aria-label="Dismiss notification">
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>
</button>
</div>
{/if}

<style>
.home {
max-width: 960px;
margin: 0 auto;
padding: var(--spacing-lg) var(--spacing-md) var(--spacing-2xl);
opacity: 0;
transform: translateY(8px);
transition: opacity 0.4s ease, transform 0.4s ease;
}

.home.mounted {
opacity: 1;
transform: translateY(0);
}

.hero {
text-align: center;
padding: var(--spacing-2xl) 0 var(--spacing-xl);
}

.title {
font-size: 2rem;
font-weight: 700;
color: var(--color-text);
margin: 0 0 var(--spacing-sm);
letter-spacing: -0.02em;
}

.subtitle {
font-size: 1.1rem;
color: var(--color-text-secondary);
margin: 0 0 var(--spacing-lg);
max-width: 540px;
margin-left: auto;
margin-right: auto;
line-height: 1.5;
}

.search-trigger {
display: inline-flex;
align-items: center;
gap: var(--spacing-sm);
padding: var(--spacing-sm) var(--spacing-md);
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
color: var(--color-text-secondary);
font-size: 0.875rem;
cursor: pointer;
transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-trigger:hover {
border-color: var(--color-primary);
box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.search-trigger kbd {
display: inline-block;
padding: 2px 6px;
font-size: 0.75rem;
font-family: var(--font-mono);
background: var(--color-background);
border: 1px solid var(--color-border);
border-radius: var(--radius-sm);
color: var(--color-text-secondary);
}

.section {
margin-bottom: var(--spacing-xl);
}

.section-title {
font-size: 0.8rem;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.08em;
color: var(--color-text-secondary);
margin: 0 0 var(--spacing-md);
padding-bottom: var(--spacing-xs);
border-bottom: 1px solid var(--color-border);
}

.card-grid {
display: grid;
gap: var(--spacing-md);
}

.card-grid.cols-3 {
grid-template-columns: 1fr;
}

.nav-card {
display: flex;
flex-direction: column;
gap: var(--spacing-xs);
padding: var(--spacing-md);
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
text-decoration: none;
color: var(--color-text);
transition:
border-color var(--transition-fast),
box-shadow var(--transition-fast),
transform var(--transition-fast);
}

.nav-card:hover {
border-color: var(--color-primary);
box-shadow: var(--shadow-sm);
transform: translateY(-2px);
}

.nav-card h3 {
font-size: 1rem;
font-weight: 600;
margin: 0;
color: var(--color-text);
}

.nav-card p {
font-size: 0.85rem;
margin: 0;
color: var(--color-text-secondary);
line-height: 1.4;
}

.card-icon {
display: flex;
align-items: center;
justify-content: center;
width: 40px;
height: 40px;
border-radius: var(--radius-sm);
margin-bottom: var(--spacing-xs);
color: var(--color-background);
}

.login-icon   { background: var(--color-primary); }
.signup-icon  { background: var(--color-secondary); }
.docs-icon    { background: var(--color-text-secondary); }
.admin-icon   { background: var(--color-primary); }
.users-icon   { background: #6366f1; }
.cms-icon     { background: #10b981; }
.ai-icon      { background: #f59e0b; }
.auth-icon    { background: #8b5cf6; }
.setup-icon   { background: var(--color-text-secondary); }
.chat-icon    { background: var(--color-primary); }
.video-icon   { background: #ec4899; }
.profile-icon { background: var(--color-secondary); }
.reset-icon   { background: var(--color-error); }

.danger-card {
border-color: color-mix(in srgb, var(--color-error) 30%, var(--color-border));
}

.danger-card:hover {
border-color: var(--color-error);
}

.toast {
position: fixed;
bottom: var(--spacing-lg);
left: 50%;
transform: translateX(-50%);
display: flex;
align-items: center;
gap: var(--spacing-sm);
padding: var(--spacing-sm) var(--spacing-md);
border-radius: var(--radius-md);
font-size: 0.875rem;
z-index: 1000;
animation: toast-in 0.3s ease;
}

.toast-error {
background: var(--color-error);
color: var(--color-background);
}

.toast-message {
flex: 1;
}

.toast-dismiss {
background: none;
border: none;
color: inherit;
cursor: pointer;
padding: 2px;
display: flex;
align-items: center;
opacity: 0.8;
}

.toast-dismiss:hover {
opacity: 1;
}

@keyframes toast-in {
from {
opacity: 0;
transform: translateX(-50%) translateY(10px);
}
to {
opacity: 1;
transform: translateX(-50%) translateY(0);
}
}

@media (min-width: 641px) {
.title {
font-size: 2.5rem;
}

.card-grid.cols-3 {
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
}
</style>
