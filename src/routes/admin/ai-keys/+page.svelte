<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	interface ModelWithPricing {
		id: string;
		pricing?: {
			input: number;
			output: number;
			cached?: number;
		};
		audioPricing?: {
			input: number;
			output: number;
		};
		ownedBy: string;
		created: number;
	}

	let keys = data.keys || [];
	let showForm = false;
	let editingKey: any = null;
	let formData = {
		name: '',
		provider: 'openai',
		apiKey: '',
		models: [] as string[],
		enabled: true,
		voiceEnabled: false,
		voiceModels: [] as string[],
		videoEnabled: false,
		videoModels: [] as string[]
	};
	let errors: Record<string, string> = {};
	let visibleKeys: Record<string, boolean> = {};
	let showDeleteConfirm = false;
	let deletingKeyId: string | null = null;

	// OpenAI models loaded from API
	let openaiChatModels: ModelWithPricing[] = [];
	let openaiVoiceModels: ModelWithPricing[] = [];
	let loadingModels = false;
	let modelsError = '';
	let modelsLoadedFromApi = false;

	const providers = [
		{ value: 'openai', label: 'OpenAI', models: [] as string[] },
		{
			value: 'anthropic',
			label: 'Anthropic',
			models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
		},
		{ value: 'google', label: 'Google (Gemini)', models: ['gemini-pro', 'gemini-pro-vision'] },
		{
			value: 'mistral',
			label: 'Mistral AI',
			models: ['mistral-large', 'mistral-medium', 'mistral-small']
		},
		{ value: 'cohere', label: 'Cohere', models: ['command', 'command-light'] },
		{ value: 'wavespeed', label: 'WaveSpeed AI', models: [] as string[] }
	];

	// Format pricing for display
	function formatPricing(
		pricing: { input: number; output: number; cached?: number } | undefined
	): string {
		if (!pricing) return '';
		let text = `$${pricing.input}/$${pricing.output}/M`;
		if (pricing.cached) {
			text += ` (cached: $${pricing.cached})`;
		}
		return text;
	}

	function formatAudioPricing(pricing: { input: number; output: number } | undefined): string {
		if (!pricing) return '';
		return `$${pricing.input}/$${pricing.output}/min`;
	}

	// Format compact pricing for display
	function formatCompactPricing(
		pricing?: { input: number; output: number; cached?: number },
		audioPricing?: { input: number; output: number }
	): string {
		const parts: string[] = [];
		if (pricing) {
			parts.push(`$${pricing.input}/$${pricing.output}/M`);
		}
		if (audioPricing) {
			parts.push(`$${audioPricing.input}/$${audioPricing.output}/min audio`);
		}
		return parts.join(' • ');
	}

	// Load OpenAI models when provider is selected or on mount
	async function loadOpenAIModels() {
		if (loadingModels) return;
		loadingModels = true;
		modelsError = '';

		try {
			const response = await fetch('/api/admin/ai-keys/models');
			if (!response.ok) {
				throw new Error('Failed to load models');
			}

			const data = await response.json();
			openaiChatModels = data.chatModels || [];
			openaiVoiceModels = data.voiceModels || [];
			modelsLoadedFromApi = data.fromApi || false;
		} catch (err) {
			console.error('Failed to load OpenAI models:', err);
			modelsError = 'Failed to load models. Using default list.';
			// Fallback to static list
			openaiChatModels = [
				{ id: 'gpt-5.2', pricing: { input: 1.75, output: 14, cached: 0.175 }, ownedBy: 'openai', created: 0 },
				{ id: 'gpt-5.1', pricing: { input: 1.25, output: 10, cached: 0.125 }, ownedBy: 'openai', created: 0 },
				{ id: 'gpt-5', pricing: { input: 1.25, output: 10, cached: 0.125 }, ownedBy: 'openai', created: 0 },
				{ id: 'gpt-5-mini', pricing: { input: 0.25, output: 2, cached: 0.025 }, ownedBy: 'openai', created: 0 },
				{ id: 'gpt-4.1', pricing: { input: 2, output: 8, cached: 0.50 }, ownedBy: 'openai', created: 0 },
				{ id: 'gpt-4.1-mini', pricing: { input: 0.40, output: 1.60, cached: 0.10 }, ownedBy: 'openai', created: 0 },
				{ id: 'gpt-4o', pricing: { input: 2.5, output: 10, cached: 1.25 }, ownedBy: 'openai', created: 0 },
				{ id: 'gpt-4o-mini', pricing: { input: 0.15, output: 0.6, cached: 0.075 }, ownedBy: 'openai', created: 0 },
				{ id: 'o4-mini', pricing: { input: 1.10, output: 4.40, cached: 0.275 }, ownedBy: 'openai', created: 0 },
				{ id: 'o3', pricing: { input: 2, output: 8, cached: 0.50 }, ownedBy: 'openai', created: 0 }
			];
			openaiVoiceModels = [
				{
					id: 'gpt-realtime',
					pricing: { input: 4, output: 16, cached: 0.40 },
					audioPricing: { input: 0.05, output: 0.19 },
					ownedBy: 'openai',
					created: 0
				},
				{
					id: 'gpt-realtime-mini',
					pricing: { input: 0.60, output: 2.40, cached: 0.06 },
					audioPricing: { input: 0.015, output: 0.06 },
					ownedBy: 'openai',
					created: 0
				},
				{
					id: 'gpt-4o-realtime-preview-2024-12-17',
					pricing: { input: 5, output: 20, cached: 2.50 },
					audioPricing: { input: 0.06, output: 0.24 },
					ownedBy: 'openai',
					created: 0
				},
				{
					id: 'gpt-4o-mini-realtime-preview-2024-12-17',
					pricing: { input: 0.60, output: 2.40, cached: 0.30 },
					audioPricing: { input: 0.015, output: 0.06 },
					ownedBy: 'openai',
					created: 0
				}
			];
		} finally {
			loadingModels = false;
		}
	}

	// Get models for current provider (only those with pricing for OpenAI)
	$: currentProviderModels =
		formData.provider === 'openai'
			? openaiChatModels.filter((m) => m.pricing)
			: providers
					.find((p) => p.value === formData.provider)
					?.models.map((m) => ({ id: m, pricing: undefined, ownedBy: '', created: 0 })) || [];

	// Get voice models with pricing only
	$: filteredVoiceModels = openaiVoiceModels.filter((m) => m.pricing || m.audioPricing);

	// Calculate total selected models pricing
	$: selectedTextModels = currentProviderModels.filter((m) => formData.models.includes(m.id));
	$: selectedVoiceModelsList = filteredVoiceModels.filter((m) =>
		formData.voiceModels.includes(m.id)
	);

	// Video models (static list from registry)
	// Pricing from https://openai.com/api/pricing/ (per second of generated video)
	const videoModelOptions = [
		{
			id: 'sora-2',
			displayName: 'Sora 2',
			description: 'Fast video generation, ideal for iteration',
			resolutions: '720p',
			pricing: { perSecond: 0.10 }
		},
		{
			id: 'sora-2-pro',
			displayName: 'Sora 2 Pro',
			description: 'Higher quality, production-grade output',
			resolutions: '720p / 1080p',
			pricing: { perSecond: 0.30, perSecondHighRes: 0.50 }
		}
	];

	// WaveSpeed video/image model options
	// Fallback pricing from https://wavespeed.ai/pricing — overridden by live API data when available
	const wavespeedModelOptions = [
		{ id: 'wan-2.1/t2v-720p', displayName: 'Wan 2.1 T2V 720p', description: 'Text-to-video, 720p quality', category: 'video', fallbackPrice: 0.03 },
		{ id: 'wan-2.1/i2v-720p', displayName: 'Wan 2.1 I2V 720p', description: 'Image-to-video, 720p quality', category: 'video', fallbackPrice: 0.04 },
		{ id: 'wan-2.1/t2v-480p', displayName: 'Wan 2.1 T2V 480p', description: 'Text-to-video, fast 480p', category: 'video', fallbackPrice: 0.02 },
		{ id: 'wan-2.2/t2v-720p', displayName: 'Wan 2.2 T2V 720p', description: 'Latest Wan text-to-video', category: 'video', fallbackPrice: 0.04 },
		{ id: 'wan-2.2/i2v-480p', displayName: 'Wan 2.2 I2V 480p', description: 'Latest Wan image-to-video', category: 'video', fallbackPrice: 0.03 },
		{ id: 'hunyuan-video/t2v', displayName: 'HunYuan Video', description: 'Tencent HunYuan text-to-video', category: 'video', fallbackPrice: 0.05 },
		{ id: 'ltx-video/ltx-2-19b-text-to-video', displayName: 'LTX 2 T2V', description: 'Lightricks text-to-video', category: 'video', fallbackPrice: 0.03 },
		{ id: 'ltx-video/ltx-2-19b-image-to-video', displayName: 'LTX 2 I2V', description: 'Lightricks image-to-video', category: 'video', fallbackPrice: 0.035 },
		{ id: 'framepack/framepack-f1', displayName: 'FramePack', description: 'Frame-based video generation', category: 'video', fallbackPrice: 0.04 },
		{ id: 'flux-dev', displayName: 'Flux Dev', description: 'High-quality image generation', category: 'image', fallbackPrice: 0.025 },
		{ id: 'flux-schnell', displayName: 'Flux Schnell', description: 'Fast image generation', category: 'image', fallbackPrice: 0.015 }
	];

	// WaveSpeed pricing data
	interface WaveSpeedPricingModel {
		model_id: string;
		name: string;
		base_price: number;
		description: string;
		type: string;
	}
	let wavespeedPricing: WaveSpeedPricingModel[] = [];
	let wavespeedPricingLoading = false;
	let wavespeedPricingError = '';
	let wavespeedPricingCached = false;

	async function loadWaveSpeedPricing(forceRefresh = false) {
		if (wavespeedPricingLoading) return;
		wavespeedPricingLoading = true;
		wavespeedPricingError = '';
		try {
			const url = forceRefresh
				? '/api/admin/ai-keys/wavespeed-pricing?refresh=true'
				: '/api/admin/ai-keys/wavespeed-pricing';
			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to load pricing');
			const data = await response.json();
			wavespeedPricing = data.models || [];
			wavespeedPricingCached = data.cached || false;
			if (data.error) wavespeedPricingError = data.error;
		} catch (err) {
			console.error('Failed to load WaveSpeed pricing:', err);
			wavespeedPricingError = 'Failed to load pricing data.';
		} finally {
			wavespeedPricingLoading = false;
		}
	}

	/**
	 * Look up base_price for a local model ID.
	 * Checks live API pricing data first, then falls back to the local fallback price.
	 * Local IDs like "wan-2.1/t2v-720p" map to API model_ids like "wavespeed-ai/wan-2.1/t2v-720p".
	 * Performs normalized matching (strips prefix, replaces / with -).
	 */
	function getWaveSpeedPrice(localModelId: string): number | null {
		// Try live API pricing first
		if (wavespeedPricing.length > 0) {
			// Direct match with wavespeed-ai/ prefix
			const prefixed = `wavespeed-ai/${localModelId}`;
			const directMatch = wavespeedPricing.find(m => m.model_id === prefixed);
			if (directMatch) return directMatch.base_price;

			// Normalized match: strip prefix and replace / with -
			const normalizedLocal = localModelId.toLowerCase();
			const normalizedMatch = wavespeedPricing.find(m => {
				const stripped = m.model_id.replace(/^wavespeed-ai\//, '').replace(/\//g, '-').toLowerCase();
				return stripped === normalizedLocal;
			});
			if (normalizedMatch) return normalizedMatch.base_price;
		}

		// Fall back to local pricing estimate
		const model = wavespeedModelOptions.find(m => m.id === localModelId);
		return model?.fallbackPrice ?? null;
	}

	/**
	 * Look up the live API price only (no fallback). Used to determine
	 * whether the displayed price came from the API or from local estimates.
	 */
	function getWaveSpeedLivePrice(localModelId: string): number | null {
		if (wavespeedPricing.length === 0) return null;

		const prefixed = `wavespeed-ai/${localModelId}`;
		const directMatch = wavespeedPricing.find(m => m.model_id === prefixed);
		if (directMatch) return directMatch.base_price;

		const normalizedLocal = localModelId.toLowerCase();
		const normalizedMatch = wavespeedPricing.find(m => {
			const stripped = m.model_id.replace(/^wavespeed-ai\//, '').replace(/\//g, '-').toLowerCase();
			return stripped === normalizedLocal;
		});
		if (normalizedMatch) return normalizedMatch.base_price;

		return null;
	}

	/**
	 * Get the model type from API data for display (e.g., "per second", "per image")
	 */
	function getWaveSpeedModelType(localModelId: string): string | null {
		if (wavespeedPricing.length === 0) return null;

		const prefixed = `wavespeed-ai/${localModelId}`;
		const match = wavespeedPricing.find(m => m.model_id === prefixed) || 
			wavespeedPricing.find(m => {
				const stripped = m.model_id.replace(/^wavespeed-ai\//, '').replace(/\//g, '-').toLowerCase();
				return stripped === localModelId.toLowerCase();
			});
		return match?.type || null;
	}

	// WaveSpeed key validation
	let wavespeedValidating = false;
	let wavespeedValidationResult: { valid: boolean; balance?: number; error?: string } | null = null;

	async function validateWavespeedKey() {
		if (!formData.apiKey.trim()) {
			wavespeedValidationResult = { valid: false, error: 'Enter an API key first' };
			return;
		}
		wavespeedValidating = true;
		wavespeedValidationResult = null;
		try {
			const response = await fetch('/api/admin/ai-keys/wavespeed-validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiKey: formData.apiKey })
			});
			wavespeedValidationResult = await response.json();
		} catch {
			wavespeedValidationResult = { valid: false, error: 'Failed to validate key' };
		} finally {
			wavespeedValidating = false;
		}
	}

	onMount(() => {
		loadOpenAIModels();
		loadWaveSpeedPricing();
	});

	function toggleModel(modelId: string) {
		if (formData.models.includes(modelId)) {
			formData.models = formData.models.filter((m) => m !== modelId);
		} else {
			formData.models = [...formData.models, modelId];
		}
	}

	function toggleVoiceModel(modelId: string) {
		if (formData.voiceModels.includes(modelId)) {
			formData.voiceModels = formData.voiceModels.filter((m) => m !== modelId);
		} else {
			formData.voiceModels = [...formData.voiceModels, modelId];
		}
	}

	function toggleVideoModel(modelId: string) {
		if (formData.videoModels.includes(modelId)) {
			formData.videoModels = formData.videoModels.filter((m) => m !== modelId);
		} else {
			formData.videoModels = [...formData.videoModels, modelId];
		}
	}

	function openAddForm() {
		showForm = true;
		editingKey = null;
		formData = {
			name: '',
			provider: 'openai',
			apiKey: '',
			models: [],
			enabled: true,
			voiceEnabled: false,
			voiceModels: [],
			videoEnabled: false,
			videoModels: []
		};
		errors = {};
		wavespeedValidationResult = null;
	}

	function openEditForm(key: any) {
		showForm = true;
		editingKey = key;
		// Support both old single model format and new multiple models format
		const existingModels = key.models || (key.model ? [key.model] : []);
		const existingVoiceModels = key.voiceModels || (key.voiceModel ? [key.voiceModel] : []);
		const existingVideoModels = key.videoModels || [];
		formData = {
			name: key.name,
			provider: key.provider,
			apiKey: '',
			models: existingModels,
			enabled: key.enabled !== undefined ? key.enabled : true,
			voiceEnabled: key.voiceEnabled ?? false,
			voiceModels: existingVoiceModels,
			videoEnabled: key.videoEnabled ?? false,
			videoModels: existingVideoModels
		};
		errors = {};
	}

	function closeForm() {
		showForm = false;
		editingKey = null;
		formData = {
			name: '',
			provider: 'openai',
			apiKey: '',
			models: [],
			enabled: true,
			voiceEnabled: false,
			voiceModels: [],
			videoEnabled: false,
			videoModels: []
		};
		errors = {};
		wavespeedValidationResult = null;
	}

	function validateForm() {
		errors = {};

		if (!formData.name.trim()) {
			errors.name = 'Key name is required';
		}

		if (!editingKey && !formData.apiKey.trim()) {
			errors.apiKey = 'API Key is required';
		}

		return Object.keys(errors).length === 0;
	}

	async function saveKey() {
		if (!validateForm()) {
			return;
		}

		try {
			const url = editingKey ? `/api/admin/ai-keys/${editingKey.id}` : '/api/admin/ai-keys';
			const method = editingKey ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				const result = await response.json();
				if (editingKey) {
					keys = keys.map((k: any) =>
						k.id === editingKey.id ? { ...k, ...formData, apiKey: undefined } : k
					);
				} else {
					keys = [...keys, result.key];
				}
				closeForm();
			} else {
				const errorData = await response.json().catch(() => null);
				errors.submit = errorData?.message || `Failed to save key (${response.status})`;
			}
		} catch (error) {
			errors.submit = 'An error occurred while saving';
		}
	}

	function openDeleteConfirm(keyId: string) {
		deletingKeyId = keyId;
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		deletingKeyId = null;
		showDeleteConfirm = false;
	}

	async function confirmDelete() {
		if (!deletingKeyId) return;

		try {
			const response = await fetch(`/api/admin/ai-keys/${deletingKeyId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				keys = keys.filter((k: any) => k.id !== deletingKeyId);
				closeDeleteConfirm();
			}
		} catch (error) {
			console.error('Failed to delete key:', error);
		}
	}

	function toggleKeyVisibility(keyId: string) {
		visibleKeys[keyId] = !visibleKeys[keyId];
	}

	function maskValue(value: string): string {
		return '••••••';
	}

	async function toggleEnabled(keyId: string, currentEnabled: boolean) {
		// Optimistically update UI
		keys = keys.map((k: any) => (k.id === keyId ? { ...k, enabled: !currentEnabled } : k));

		try {
			const response = await fetch(`/api/admin/ai-keys/${keyId}/toggle`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ enabled: !currentEnabled })
			});

			if (!response.ok) {
				// Revert on failure
				keys = keys.map((k: any) => (k.id === keyId ? { ...k, enabled: currentEnabled } : k));
				console.error('Failed to toggle key status');
			}
		} catch (error) {
			// Revert on error
			keys = keys.map((k: any) => (k.id === keyId ? { ...k, enabled: currentEnabled } : k));
			console.error('Failed to toggle key status:', error);
		}
	}
</script>

<svelte:head>
	<title>AI Provider Keys - Admin - Nabu</title>
</svelte:head>

<div class="ai-keys-page">
	<header class="page-header">
		<h1>AI Provider Keys</h1>
		<p class="page-description">
			Manage API keys for AI providers like OpenAI, Anthropic, and others.
		</p>
	</header>

	<div class="page-actions">
		<button class="btn btn-primary" on:click={openAddForm}>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M12 5v14m-7-7h14" />
			</svg>
			Add AI Key
		</button>
	</div>

	{#if keys.length === 0}
		<div class="empty-state">
			<svg
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M12 3v18m0-18l-3 3m3-3l3 3M3 12h18M3 12l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
			</svg>
			<h3>No AI provider keys configured</h3>
			<p>Add your first AI provider key to enable AI features.</p>
		</div>
	{:else}
		<div class="keys-list">
			{#each keys as key (key.id)}
				{@const keyModels = key.models || (key.model ? [key.model] : [])}
				{@const keyVoiceModels = key.voiceModels || (key.voiceModel ? [key.voiceModel] : [])}
				<div class="key-card">
					<div class="key-header">
						<div class="key-info">
							<h3>{key.name}</h3>
							<div class="key-badges">
								<span class="key-provider">{key.provider}</span>
								{#if keyModels.length > 0}
									<span class="key-model-count">
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
										</svg>
										{keyModels.length} text model{keyModels.length > 1 ? 's' : ''}
									</span>
								{/if}
								{#if key.provider === 'openai' && key.voiceEnabled && keyVoiceModels.length > 0}
									<span class="key-voice-badge">
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
											<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
											<line x1="12" y1="19" x2="12" y2="23" />
											<line x1="8" y1="23" x2="16" y2="23" />
										</svg>
										{keyVoiceModels.length} voice model{keyVoiceModels.length > 1 ? 's' : ''}
									</span>
								{/if}
								{#if key.videoEnabled && (key.videoModels?.length ?? 0) > 0}
									<span class="key-voice-badge video-badge">
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<rect x="2" y="4" width="20" height="16" rx="2" />
											<polygon points="10,9 16,12 10,15" />
										</svg>
										{key.videoModels.length} video model{key.videoModels.length > 1 ? 's' : ''}
									</span>
								{/if}
							</div>
						</div>
						<div class="key-actions">
							<label class="toggle-switch">
								<input
									type="checkbox"
									checked={key.enabled !== false}
									on:change={() => toggleEnabled(key.id, key.enabled !== false)}
									aria-label={`Toggle ${key.name}`}
								/>
								<span class="slider"></span>
							</label>
							<button
								class="btn-icon"
								on:click={() => openEditForm(key)}
								aria-label={`Edit ${key.name}`}
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
								</svg>
							</button>
							<button
								class="btn-icon btn-danger"
								on:click={() => openDeleteConfirm(key.id)}
								aria-label={`Delete ${key.name}`}
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
									/>
								</svg>
							</button>
						</div>
					</div>
					{#if key.apiKey}
						<div class="key-field">
							<div class="label">API Key</div>
							<div class="key-value">
								<span>{visibleKeys[key.id] ? key.apiKey : maskValue(key.apiKey)}</span>
								<button
									class="btn-icon-sm"
									on:click={() => toggleKeyVisibility(key.id)}
									aria-label={visibleKeys[key.id] ? 'Hide value' : 'Show value'}
								>
									{#if visibleKeys[key.id]}
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
											/>
										</svg>
									{:else}
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
											<circle cx="12" cy="12" r="3" />
										</svg>
									{/if}
								</button>
							</div>
						</div>
					{/if}
					<div class="key-meta">
						<span>Added {new Date(key.createdAt).toLocaleDateString()}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showForm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={closeForm}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal modal-lg" on:click|stopPropagation>
			<div class="modal-header">
				<h2>{editingKey ? 'Edit AI Key' : 'Add New AI Key'}</h2>
				<button class="btn-close" on:click={closeForm} aria-label="Close">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="modal-body">
				<div class="form-row">
					<div class="form-group">
						<label for="key-name">Key Name</label>
						<input
							id="key-name"
							type="text"
							bind:value={formData.name}
							class:error={errors.name}
							placeholder="e.g., OpenAI Production"
						/>
						{#if errors.name}
							<span class="error-message">{errors.name}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for="provider">Provider</label>
						<select id="provider" bind:value={formData.provider}>
							{#each providers as provider}
								<option value={provider.value}>{provider.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-group">
					<label for="api-key">API Key</label>
					{#if formData.provider === 'wavespeed'}
						<div class="api-key-helper">
							<a
								href="https://wavespeed.ai/accesskey"
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-sm btn-outline"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
								Get Your API Key
							</a>
						</div>
					{/if}
					<input
						id="api-key"
						type="password"
						bind:value={formData.apiKey}
						class:error={errors.apiKey}
						placeholder={editingKey ? 'Leave blank to keep existing' : formData.provider === 'wavespeed' ? 'Paste your WaveSpeed API key' : 'Enter API key'}
					/>
					{#if errors.apiKey}
						<span class="error-message">{errors.apiKey}</span>
					{/if}
					{#if formData.provider === 'wavespeed'}
						<div class="wavespeed-validate">
							<button
								type="button"
								class="btn btn-sm btn-secondary"
								on:click={validateWavespeedKey}
								disabled={wavespeedValidating}
							>
								{#if wavespeedValidating}
									Validating...
								{:else}
									Validate Key
								{/if}
							</button>
							{#if wavespeedValidationResult}
								{#if wavespeedValidationResult.valid}
									<span class="validation-success">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<polyline points="20 6 9 17 4 12" />
										</svg>
										Valid — Balance: ${wavespeedValidationResult.balance?.toFixed(2)}
									</span>
								{:else}
									<span class="validation-error">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<circle cx="12" cy="12" r="10" />
											<line x1="15" y1="9" x2="9" y2="15" />
											<line x1="9" y1="9" x2="15" y2="15" />
										</svg>
										{wavespeedValidationResult.error || 'Invalid key'}
									</span>
								{/if}
							{/if}
						</div>
					{/if}
				</div>

				{#if formData.provider === 'openai' && (selectedTextModels.length > 0 || selectedVoiceModelsList.length > 0)}
					<div class="pricing-summary">
						<h4>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
							</svg>
							Selected Models Pricing
						</h4>
						{#if selectedTextModels.length > 0}
							<div class="pricing-group">
								<span class="pricing-group-title">Text Models ({selectedTextModels.length})</span>
								{#each selectedTextModels as model}
									<div class="pricing-item">
										<span class="pricing-item-name">{model.id}</span>
										<span class="pricing-item-value">{formatPricing(model.pricing)}</span>
									</div>
								{/each}
							</div>
						{/if}
						{#if formData.voiceEnabled && selectedVoiceModelsList.length > 0}
							<div class="pricing-group">
								<span class="pricing-group-title"
									>Voice Models ({selectedVoiceModelsList.length})</span
								>
								{#each selectedVoiceModelsList as model}
									<div class="pricing-item">
										<span class="pricing-item-name">{model.id}</span>
										<span class="pricing-item-value">
											{model.pricing ? formatPricing(model.pricing) : ''}
											{model.pricing && model.audioPricing ? ' • ' : ''}
											{model.audioPricing ? formatAudioPricing(model.audioPricing) : ''}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				{#if formData.provider === 'openai'}
					<div class="form-section">
						<div class="section-header">
							<h3>
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
								</svg>
								Text Models
							</h3>
							<span class="selection-count">{formData.models.length} selected</span>
						</div>
						{#if loadingModels}
							<div class="loading-state">
								<span class="loading-indicator">Loading models...</span>
							</div>
						{:else if modelsError}
							<span class="warning-message">{modelsError}</span>
						{:else}
							{#if modelsLoadedFromApi}
								<span class="success-hint">Models loaded from your OpenAI API</span>
							{/if}
							<div class="model-grid">
								{#each currentProviderModels as model}
									<button
										type="button"
										class="model-card"
										class:selected={formData.models.includes(model.id)}
										on:click={() => toggleModel(model.id)}
									>
										<div class="model-card-header">
											<span class="model-name">{model.id}</span>
											<label class="toggle-switch-sm">
												<input
													type="checkbox"
													checked={formData.models.includes(model.id)}
													on:click|stopPropagation={() => toggleModel(model.id)}
												/>
												<span class="slider-sm"></span>
											</label>
										</div>
										{#if model.pricing}
											<div class="model-pricing">
												<span class="price-tag">
													<span class="price-label">In:</span> ${model.pricing.input}/M
												</span>
												<span class="price-tag">
													<span class="price-label">Out:</span> ${model.pricing.output}/M
												</span>
												{#if model.pricing.cached}
													<span class="price-tag cached">
														<span class="price-label">Cached:</span> ${model.pricing.cached}/M
													</span>
												{/if}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<div class="form-section">
						<div class="section-header">
							<h3>
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
									<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
									<line x1="12" y1="19" x2="12" y2="23" />
									<line x1="8" y1="23" x2="16" y2="23" />
								</svg>
								Voice Models
							</h3>
							<div class="section-header-actions">
								<span class="selection-count">{formData.voiceModels.length} selected</span>
								<label class="toggle-switch">
									<input type="checkbox" bind:checked={formData.voiceEnabled} />
									<span class="slider"></span>
								</label>
							</div>
						</div>
						{#if formData.voiceEnabled}
							<p class="help-text-inline">
								Enable voice chat to allow users to interact with AI using speech (OpenAI Realtime
								API).
							</p>
							{#if loadingModels}
								<div class="loading-state">
									<span class="loading-indicator">Loading models...</span>
								</div>
							{:else}
								<div class="model-grid">
									{#each filteredVoiceModels as model}
										<button
											type="button"
											class="model-card voice-card"
											class:selected={formData.voiceModels.includes(model.id)}
											on:click={() => toggleVoiceModel(model.id)}
										>
											<div class="model-card-header">
												<span class="model-name">{model.id}</span>
												<label class="toggle-switch-sm">
													<input
														type="checkbox"
														checked={formData.voiceModels.includes(model.id)}
														on:click|stopPropagation={() => toggleVoiceModel(model.id)}
													/>
													<span class="slider-sm"></span>
												</label>
											</div>
											<div class="model-pricing">
												{#if model.pricing}
													<div class="price-row">
														<span class="price-category">Tokens:</span>
														<span class="price-tag">
															<span class="price-label">In:</span> ${model.pricing.input}/M
														</span>
														<span class="price-tag">
															<span class="price-label">Out:</span> ${model.pricing.output}/M
														</span>
													</div>
												{/if}
												{#if model.audioPricing}
													<div class="price-row">
														<span class="price-category">Audio:</span>
														<span class="price-tag audio">
															<span class="price-label">In:</span> ${model.audioPricing.input}/min
														</span>
														<span class="price-tag audio">
															<span class="price-label">Out:</span> ${model.audioPricing.output}/min
														</span>
													</div>
												{/if}
											</div>
										</button>
									{/each}
								</div>
							{/if}
						{:else}
							<p class="help-text-inline disabled">
								Toggle voice models on to enable real-time voice conversations.
							</p>
						{/if}
					</div>

					<!-- Video Models Section -->
					<div class="form-section">
						<div class="section-header">
							<h3>
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="2" y="4" width="20" height="16" rx="2" />
									<polygon points="10,9 16,12 10,15" />
								</svg>
								Video Generation
							</h3>
							<div class="section-header-actions">
								<span class="selection-count">{formData.videoModels.length} selected</span>
								<label class="toggle-switch">
									<input type="checkbox" bind:checked={formData.videoEnabled} />
									<span class="slider"></span>
								</label>
							</div>
						</div>
						{#if formData.videoEnabled}
							<p class="help-text-inline">
								Enable video generation to allow users to create AI-generated videos from text
								prompts.
							</p>
							<div class="model-grid">
								{#each videoModelOptions as model}
									<button
										type="button"
										class="model-card video-card"
										class:selected={formData.videoModels.includes(model.id)}
										on:click={() => toggleVideoModel(model.id)}
									>
										<div class="model-card-header">
											<span class="model-name">{model.displayName}</span>
											<label class="toggle-switch-sm">
												<input
													type="checkbox"
													checked={formData.videoModels.includes(model.id)}
													on:click|stopPropagation={() => toggleVideoModel(model.id)}
												/>
												<span class="slider-sm"></span>
											</label>
										</div>
										<div class="model-description">
											{model.description}
										</div>
										{#if model.pricing}
											<div class="model-pricing">
												<div class="price-row">
													<span class="price-tag">
														<span class="price-label">{model.resolutions}:</span> ${model.pricing.perSecond.toFixed(2)}/sec
													</span>
												</div>
												{#if model.pricing.perSecondHighRes}
													<div class="price-row">
														<span class="price-tag">
															<span class="price-label">1080p+:</span> ${model.pricing.perSecondHighRes.toFixed(2)}/sec
														</span>
													</div>
												{/if}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<p class="help-text-inline disabled">
								Toggle video generation on to enable AI video creation from prompts.
							</p>
						{/if}
					</div>
				{:else if formData.provider === 'wavespeed'}
					<!-- WaveSpeed models -->
					<div class="form-section">
						<div class="section-header">
							<h3>
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="2" y="4" width="20" height="16" rx="2" />
									<polygon points="10,9 16,12 10,15" />
								</svg>
								Video &amp; Image Models
							</h3>
							<div class="section-header-actions">
								<span class="selection-count">{formData.videoModels.length} selected</span>
								<label class="toggle-switch">
									<input type="checkbox" bind:checked={formData.videoEnabled} />
									<span class="slider"></span>
								</label>
							</div>
						</div>
						{#if formData.videoEnabled}
							<p class="help-text-inline">
								Select which WaveSpeed models to enable for video and image generation.
								{#if wavespeedPricingLoading}
									<span class="loading-hint">Loading pricing...</span>
								{:else if wavespeedPricingCached}
									<button type="button" class="refresh-pricing-btn" on:click|preventDefault={() => loadWaveSpeedPricing(true)}>
										↻ Refresh pricing
									</button>
								{/if}
							</p>
							{@const videoModels = wavespeedModelOptions.filter(m => m.category === 'video')}
							{@const imageModels = wavespeedModelOptions.filter(m => m.category === 'image')}
							{#if videoModels.length > 0}
								<div class="model-category-label">Video Models</div>
								<div class="model-grid">
									{#each videoModels as model}
										{@const price = getWaveSpeedPrice(model.id)}
										{@const modelType = getWaveSpeedModelType(model.id)}
										{@const isLivePrice = wavespeedPricing.length > 0 && getWaveSpeedLivePrice(model.id) !== null}
										<button
											type="button"
											class="model-card video-card"
											class:selected={formData.videoModels.includes(model.id)}
											on:click={() => toggleVideoModel(model.id)}
										>
											<div class="model-card-header">
												<span class="model-name">{model.displayName}</span>
												<label class="toggle-switch-sm">
													<input
														type="checkbox"
														checked={formData.videoModels.includes(model.id)}
														on:click|stopPropagation={() => toggleVideoModel(model.id)}
													/>
													<span class="slider-sm"></span>
												</label>
											</div>
											<div class="model-description">
												{model.description}
											</div>
											{#if price !== null}
												<div class="model-pricing">
													<span class="price-tag wavespeed">
														{#if isLivePrice}
															${price}{modelType?.includes('video') ? '/sec' : '/run'}
														{:else}
															~${price}/run
														{/if}
													</span>
												</div>
											{/if}
										</button>
									{/each}
								</div>
							{/if}
							{#if imageModels.length > 0}
								<div class="model-category-label">Image Models</div>
								<div class="model-grid">
									{#each imageModels as model}
										{@const price = getWaveSpeedPrice(model.id)}
										{@const isLivePrice = wavespeedPricing.length > 0 && getWaveSpeedLivePrice(model.id) !== null}
										<button
											type="button"
											class="model-card video-card"
											class:selected={formData.videoModels.includes(model.id)}
											on:click={() => toggleVideoModel(model.id)}
										>
											<div class="model-card-header">
												<span class="model-name">{model.displayName}</span>
												<label class="toggle-switch-sm">
													<input
														type="checkbox"
														checked={formData.videoModels.includes(model.id)}
														on:click|stopPropagation={() => toggleVideoModel(model.id)}
													/>
													<span class="slider-sm"></span>
												</label>
											</div>
											<div class="model-description">
												{model.description}
											</div>
											{#if price !== null}
												<div class="model-pricing">
													<span class="price-tag wavespeed">
														{#if isLivePrice}
															${price}/image
														{:else}
															~${price}/image
														{/if}
													</span>
												</div>
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						{:else}
							<p class="help-text-inline disabled">
								Toggle on to enable WaveSpeed video and image generation models.
							</p>
						{/if}
					</div>
				{:else}
					<!-- Non-OpenAI providers -->
					<div class="form-section">
						<div class="section-header">
							<h3>Models</h3>
							<span class="selection-count">{formData.models.length} selected</span>
						</div>
						<div class="model-grid">
							{#each currentProviderModels as model}
								<button
									type="button"
									class="model-card"
									class:selected={formData.models.includes(model.id)}
									on:click={() => toggleModel(model.id)}
								>
									<div class="model-card-header">
										<span class="model-name">{model.id}</span>
										<label class="toggle-switch-sm">
											<input
												type="checkbox"
												checked={formData.models.includes(model.id)}
												on:click|stopPropagation={() => toggleModel(model.id)}
											/>
											<span class="slider-sm"></span>
										</label>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if errors.submit}
					<div class="error-message submit-error">{errors.submit}</div>
				{/if}
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={closeForm}>Cancel</button>
				<button class="btn btn-primary" on:click={saveKey}>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
						<polyline points="17 21 17 13 7 13 7 21" />
						<polyline points="7 3 7 8 15 8" />
					</svg>
					Save Key
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showDeleteConfirm}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={closeDeleteConfirm}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal modal-sm" on:click|stopPropagation>
			<div class="modal-header">
				<h2>Confirm Deletion</h2>
			</div>
			<div class="modal-body">
				<p>Are you sure you want to delete this AI provider key? This action cannot be undone.</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={closeDeleteConfirm}>Cancel</button>
				<button class="btn btn-danger" on:click={confirmDelete}>Confirm</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.ai-keys-page {
		max-width: 1000px;
	}

	.page-header {
		margin-bottom: var(--spacing-2xl);
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--spacing-sm);
	}

	.page-description {
		color: var(--color-text-secondary);
		font-size: 1.125rem;
	}

	.page-actions {
		margin-bottom: var(--spacing-xl);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		font-weight: 500;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-primary {
		background: var(--color-primary);
		color: var(--color-background);
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border-color: var(--color-border);
	}

	.btn-secondary:hover {
		background: var(--color-background);
	}

	.btn-sm {
		padding: var(--spacing-xs) var(--spacing-sm);
		font-size: 0.813rem;
	}

	.btn-outline {
		background: transparent;
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.btn-outline:hover {
		background: var(--color-primary);
		color: var(--color-background);
	}

	.btn-danger {
		background: #ef4444;
		color: white;
	}

	.btn-danger:hover {
		background: #dc2626;
	}

	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}

	.btn-icon:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.btn-icon.btn-danger:hover {
		background: #fef2f2;
		color: #ef4444;
	}

	.btn-icon-sm {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}

	.btn-icon-sm:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-4xl);
		text-align: center;
		color: var(--color-text-secondary);
	}

	.empty-state svg {
		margin-bottom: var(--spacing-lg);
		opacity: 0.5;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--spacing-sm);
	}

	.keys-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.key-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
	}

	.key-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-md);
	}

	.key-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.key-info h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.key-badges {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.key-provider,
	.key-voice-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		text-transform: capitalize;
	}

	.key-provider {
		background: var(--color-background);
		color: var(--color-text-secondary);
	}

	.key-voice-badge {
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		color: var(--color-background);
		font-weight: 500;
	}

	.key-actions {
		display: flex;
		gap: var(--spacing-xs);
	}

	.key-field {
		margin-bottom: var(--spacing-md);
	}

	.key-field .label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xs);
	}

	.key-value {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: var(--color-background);
		border-radius: var(--radius-md);
		font-family: monospace;
		font-size: 0.875rem;
	}

	.key-value span {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.key-meta {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow: auto;
	}

	.modal-sm {
		max-width: 400px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.btn-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-md);
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}

	.btn-close:hover {
		background: var(--color-background);
		color: var(--color-text);
	}

	.modal-body {
		padding: var(--spacing-lg);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
	}

	.form-section {
		margin-top: var(--spacing-xl);
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
	}

	.form-section h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--spacing-md);
	}

	.form-group {
		margin-bottom: var(--spacing-md);
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--spacing-xs);
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: var(--spacing-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-text);
		font-size: 1rem;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-group input.error {
		border-color: #ef4444;
	}

	.error-message {
		display: block;
		margin-top: var(--spacing-xs);
		font-size: 0.875rem;
		color: #ef4444;
	}

	.warning-message {
		display: block;
		margin-top: var(--spacing-xs);
		font-size: 0.813rem;
		color: #f59e0b;
	}

	.success-hint {
		display: block;
		margin-top: var(--spacing-xs);
		font-size: 0.813rem;
		color: #10b981;
	}

	.loading-indicator {
		font-size: 0.813rem;
		color: var(--color-text-secondary);
		font-weight: 400;
		margin-left: var(--spacing-xs);
	}

	.pricing-summary {
		margin-bottom: var(--spacing-md);
		padding: var(--spacing-md);
		background: linear-gradient(
			135deg,
			var(--color-primary-soft, rgba(99, 102, 241, 0.1)),
			var(--color-secondary-soft, rgba(139, 92, 246, 0.1))
		);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.pricing-summary h4 {
		margin: 0 0 var(--spacing-sm) 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 24px;
		margin-right: var(--spacing-sm);
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-border);
		transition: var(--transition-fast);
		border-radius: 24px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: var(--color-background);
		transition: var(--transition-fast);
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: var(--color-primary);
	}

	input:checked + .slider:before {
		transform: translateX(24px);
	}

	.toggle-switch:hover .slider {
		opacity: 0.9;
	}

	select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* New styles for multi-select model interface */
	.modal-lg {
		max-width: 700px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-md);
	}

	.section-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.section-header h3 {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.section-header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.selection-count {
		font-size: 0.813rem;
		color: var(--color-text-secondary);
		background: var(--color-background);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
	}

	.model-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-sm);
		max-height: 280px;
		overflow-y: auto;
		padding: var(--spacing-xs);
	}

	.model-card {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-sm);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
	}

	.model-card:hover {
		border-color: var(--color-primary);
		background: var(--color-surface);
	}

	.model-card.selected {
		border-color: var(--color-primary);
		background: linear-gradient(
			135deg,
			var(--color-primary-soft, rgba(99, 102, 241, 0.1)),
			var(--color-secondary-soft, rgba(139, 92, 246, 0.05))
		);
	}

	.model-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.model-name {
		font-size: 0.813rem;
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.model-pricing {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.price-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
	}

	.price-category {
		font-size: 0.688rem;
		color: var(--color-text-secondary);
		min-width: 45px;
	}

	.price-tag {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 0.688rem;
		color: var(--color-text-secondary);
		background: var(--color-surface);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		font-family: monospace;
	}

	.price-tag.cached {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}

	.price-tag.audio {
		background: rgba(139, 92, 246, 0.1);
		color: var(--color-secondary, #8b5cf6);
	}

	.price-tag.wavespeed {
		background: rgba(59, 130, 246, 0.1);
		color: var(--color-primary, #3b82f6);
	}

	.price-label {
		font-weight: 500;
		opacity: 0.7;
	}

	.loading-hint {
		color: var(--color-text-secondary);
		font-style: italic;
		font-size: 0.8rem;
	}

	.refresh-pricing-btn {
		background: none;
		border: none;
		color: var(--color-primary);
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0;
		margin-left: var(--spacing-xs);
		text-decoration: underline;
	}

	.refresh-pricing-btn:hover {
		opacity: 0.8;
	}

	.toggle-switch-sm {
		position: relative;
		display: inline-block;
		width: 32px;
		height: 18px;
		flex-shrink: 0;
	}

	.toggle-switch-sm input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider-sm {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-border);
		transition: var(--transition-fast);
		border-radius: 18px;
	}

	.slider-sm:before {
		position: absolute;
		content: '';
		height: 14px;
		width: 14px;
		left: 2px;
		bottom: 2px;
		background-color: var(--color-background);
		transition: var(--transition-fast);
		border-radius: 50%;
	}

	.toggle-switch-sm input:checked + .slider-sm {
		background-color: var(--color-primary);
	}

	.toggle-switch-sm input:checked + .slider-sm:before {
		transform: translateX(14px);
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xl);
		color: var(--color-text-secondary);
	}

	.help-text-inline {
		font-size: 0.813rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-md);
	}

	.help-text-inline.disabled {
		opacity: 0.6;
		font-style: italic;
	}

	.voice-card {
		min-height: 80px;
	}

	.pricing-summary h4 {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.pricing-group {
		margin-bottom: var(--spacing-sm);
	}

	.pricing-group:last-child {
		margin-bottom: 0;
	}

	.pricing-group-title {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--spacing-xs);
	}

	.pricing-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2px 0;
		font-size: 0.813rem;
	}

	.pricing-item-name {
		color: var(--color-text);
		font-weight: 500;
	}

	.pricing-item-value {
		color: var(--color-text-secondary);
		font-family: monospace;
	}

	.submit-error {
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm);
		background: rgba(239, 68, 68, 0.1);
		border-radius: var(--radius-md);
	}

	.key-model-count {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		background: var(--color-primary);
		color: var(--color-background);
		opacity: 0.8;
	}

	@media (min-width: 601px) {
		.form-row {
			grid-template-columns: 1fr 1fr;
		}

		.model-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}

		.section-header {
			flex-direction: row;
			align-items: center;
		}
	}

	/* WaveSpeed-specific styles */
	.api-key-helper {
		display: flex;
		margin-bottom: var(--spacing-sm);
	}

	.api-key-helper a {
		text-decoration: none;
	}

	.wavespeed-validate {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
	}

	.validation-success {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.813rem;
		color: var(--color-success, #22c55e);
		font-weight: 500;
	}

	.validation-error {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.813rem;
		color: var(--color-error, #ef4444);
		font-weight: 500;
	}

	.model-category-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
	}

	.model-description {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin-top: 4px;
	}
</style>
