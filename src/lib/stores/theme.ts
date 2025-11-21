import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize theme from localStorage or system preference
function getInitialTheme(): string {
	if (browser) {
		const stored = localStorage.getItem('theme');
		if (stored) return stored;
		
		// Check system preference
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}
	}
	return 'dark'; // Default to dark
}

const theme = writable<string>(getInitialTheme());

// Subscribe to changes and update localStorage
if (browser) {
	theme.subscribe(value => {
		localStorage.setItem('theme', value);
	});
}

export const themeStore = theme;
