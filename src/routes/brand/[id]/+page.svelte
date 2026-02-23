<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import type { BrandProfile } from '$lib/types/onboarding';
	import BrandFieldCard from '$lib/components/BrandFieldCard.svelte';
	import BrandFieldHistory from '$lib/components/BrandFieldHistory.svelte';
	import BrandTextPicker from '$lib/components/BrandTextPicker.svelte';
	import MediaGallery from '$lib/components/MediaGallery.svelte';
	import AITextQuickGenerate from '$lib/components/AITextQuickGenerate.svelte';
	import { labelToKey } from '$lib/utils/text';
	import { FIELD_TO_TEXT_MAPPING } from '$lib/services/brand';

	export let data: PageData;

	// ─── Types ───────────────────────────────────────────────

	interface BrandFieldItem {
		key: string;
		label: string;
		value: unknown;
		type: 'text' | 'color' | 'list' | 'object' | 'archetype';
	}

	interface BrandSection {
		id: string;
		title: string;
		icon: string;
		fields: BrandFieldItem[];
	}

	interface TextAsset {
		id: string;
		brandProfileId: string;
		category: string;
		key: string;
		label: string;
		value: string;
		language: string;
		sortOrder: number;
		createdAt: string;
		updatedAt: string;
	}

	interface MediaAsset {
		id: string;
		brandProfileId: string;
		mediaType: 'image' | 'audio' | 'video';
		category: string;
		name: string;
		description?: string;
		url?: string;
		r2Key?: string;
		mimeType?: string;
		fileSize?: number;
		width?: number;
		height?: number;
		durationSeconds?: number;
		tags?: string[];
		isPrimary: boolean;
		createdAt: string;
		updatedAt: string;
	}

	interface AssetSummary {
		textCount: number;
		imageCount: number;
		audioCount: number;
		videoCount: number;
		videoGenerationsCount: number;
		totalCount: number;
	}

	interface VideoItem {
		id: string;
		prompt: string;
		provider: string;
		model: string;
		status: string;
		videoUrl: string | null;
		thumbnailUrl: string | null;
		r2Key: string | null;
		duration: number | null;
		aspectRatio: string | null;
		cost: number | null;
		error: string | null;
		createdAt: string;
		completedAt: string | null;
	}

	// ─── State ───────────────────────────────────────────────

	let profile: BrandProfile | null = null;
	let sections: BrandSection[] = [];
	let isLoading = true;
	let error: string | null = null;

	// Tab navigation
	let activeTab: 'profile' | 'text' | 'images' | 'audio' | 'videos' = 'profile';

	// Field history modal
	let historyFieldKey: string | null = null;
	let historyFieldLabel: string | null = null;

	// Editing state (profile fields)
	let editingField: string | null = null;
	let editValue = '';
	let isSaving = false;

	// Text picker state
	let pickerFieldKey: string | null = null;
	let pickerFieldLabel: string | null = null;

	// Asset state
	let assetSummary: AssetSummary | null = null;
	let textAssets: TextAsset[] = [];
	let imageAssets: MediaAsset[] = [];
	let audioAssets: MediaAsset[] = [];
	let videoAssets: MediaAsset[] = [];
	let brandVideos: VideoItem[] = [];
	let assetsLoading = false;

	// Text asset creation
	let showAddText = false;
	let showAITextGenerate = false;
	let newTextCategory = 'names';
	let selectedPresetKey = ''; // '' = pick one, '__custom__' = custom entry
	let customLabel = '';
	let newTextValue = '';

	// Derived key/label from preset or custom entry
	$: currentPresets = aiPresets;
	$: selectedPreset = selectedPresetKey && selectedPresetKey !== '__custom__'
		? currentPresets.find(p => p.key === selectedPresetKey) ?? null
		: null;
	$: newTextLabel = selectedPreset ? selectedPreset.label : customLabel;
	$: newTextKey = selectedPreset ? selectedPreset.key : labelToKey(customLabel);

	// Text editing
	let editingTextId: string | null = null;
	let editTextValue = '';

	// AI text generation
	let aiGenerating = false;
	let aiError: string | null = null;
	let showAiPrompt = false;
	let aiCustomPrompt = '';
	let aiPresets: Array<{ key: string; label: string; promptTemplate: string }> = [];
	let aiEditGenerating = false;
	let aiEditCustomPrompt = '';
	let showAiEditPrompt = false;

	// Text categories config
	const textCategoryInfo: Record<string, { label: string; icon: string; description: string }> = {
		names: { label: 'Names', icon: '🏷️', description: 'Brand name, legal name, DBA, abbreviation' },
		messaging: { label: 'Messaging', icon: '💬', description: 'Tagline, slogan, elevator pitch, value proposition' },
		descriptions: { label: 'Descriptions', icon: '📝', description: 'Short bio, long bio, boilerplate, about us' },
		legal: { label: 'Legal', icon: '⚖️', description: 'Copyright notice, trademark text, disclaimers' },
		social: { label: 'Social', icon: '📱', description: 'Social media bios — Twitter, Instagram, LinkedIn' },
		voice: { label: 'Voice', icon: '🎤', description: 'Tone guidelines, vocabulary, key phrases' }
	};

	// Completion stats
	$: filledFields = sections.reduce((count, section) => {
		return count + section.fields.filter((f) => f.value != null && f.value !== '').length;
	}, 0);

	$: totalFields = sections.reduce((count, section) => count + section.fields.length, 0);

	$: completionPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

	// Group text assets by category
	$: textsByCategory = textAssets.reduce((groups, text) => {
		if (!groups[text.category]) groups[text.category] = [];
		groups[text.category].push(text);
		return groups;
	}, {} as Record<string, TextAsset[]>);

	onMount(async () => {
		await loadProfile();
		loadAssetSummary();
	});

	async function loadProfile() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch(`/api/brand/profile?id=${data.brandId}`);
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Brand not found';
					return;
				}
				throw new Error('Failed to load brand profile');
			}
			const result = await res.json();
			profile = result.profile;
			sections = result.sections || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load';
		} finally {
			isLoading = false;
		}
	}

	function openHistory(fieldKey: string, fieldLabel: string) {
		historyFieldKey = fieldKey;
		historyFieldLabel = fieldLabel;
	}

	function closeHistory() {
		historyFieldKey = null;
		historyFieldLabel = null;
	}

	function startEditing(fieldKey: string, currentValue: unknown) {
		editingField = fieldKey;
		if (currentValue == null) {
			editValue = '';
		} else if (typeof currentValue === 'string') {
			editValue = currentValue;
		} else if (Array.isArray(currentValue)) {
			editValue = currentValue.join(', ');
		} else {
			editValue = JSON.stringify(currentValue, null, 2);
		}
	}

	function cancelEditing() {
		editingField = null;
		editValue = '';
	}

	function openTextPicker(fieldKey: string, fieldLabel: string) {
		pickerFieldKey = fieldKey;
		pickerFieldLabel = fieldLabel;
	}

	function closeTextPicker() {
		pickerFieldKey = null;
		pickerFieldLabel = null;
	}

	async function handleTextPicked(event: CustomEvent<{ value: string; label: string }>) {
		if (!profile || !pickerFieldKey) return;
		const fieldKey = pickerFieldKey;
		closeTextPicker();

		try {
			const res = await fetch('/api/brand/update-field', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					profileId: profile.id,
					fieldName: fieldKey,
					newValue: event.detail.value,
					changeSource: 'manual'
				})
			});

			if (!res.ok) throw new Error('Failed to save');
			await loadProfile();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to apply text';
		}
	}

	async function saveField(fieldKey: string, fieldType: string, valueFromEvent?: string) {
		if (!profile || isSaving) return;
		isSaving = true;

		// Use the value passed from the event (captured at save time)
		// This is critical — editValue can be corrupted by re-renders
		const rawValue = valueFromEvent ?? editValue;

		let parsedValue: unknown = rawValue;

		// Parse list fields
		if (fieldType === 'list' && typeof rawValue === 'string') {
			parsedValue = rawValue
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		}

		// Parse object fields
		if (fieldType === 'object' && typeof rawValue === 'string') {
			try {
				parsedValue = JSON.parse(rawValue);
			} catch {
				// Keep as string if not valid JSON
			}
		}

		try {
			const res = await fetch('/api/brand/update-field', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					profileId: profile.id,
					fieldName: fieldKey,
					newValue: parsedValue,
					changeSource: 'manual'
				})
			});

			if (!res.ok) throw new Error('Failed to save');

			await loadProfile();
			editingField = null;
			editValue = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save field';
		} finally {
			isSaving = false;
		}
	}

	async function handleRevert(event: CustomEvent<{ versionId: string }>) {
		if (!profile || !historyFieldKey) return;

		try {
			const res = await fetch('/api/brand/revert-field', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					profileId: profile.id,
					fieldName: historyFieldKey,
					versionId: event.detail.versionId
				})
			});

			if (!res.ok) throw new Error('Failed to revert');

			closeHistory();
			await loadProfile();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to revert';
		}
	}

	// ─── Asset Management Functions ─────────────────────────

	async function loadAssetSummary() {
		try {
			const res = await fetch(`/api/brand/assets/summary?brandProfileId=${data.brandId}`);
			if (res.ok) {
				const result = await res.json();
				assetSummary = result.summary;
			}
		} catch {
			// Non-critical
		}
	}

	async function loadTabAssets(tab: string) {
		assetsLoading = true;
		try {
			if (tab === 'text') {
				const res = await fetch(`/api/brand/assets/texts?brandProfileId=${data.brandId}`);
				if (res.ok) {
					const result = await res.json();
					textAssets = result.texts;
				}
			} else if (tab === 'images') {
				const res = await fetch(`/api/brand/assets/media?brandProfileId=${data.brandId}&mediaType=image`);
				if (res.ok) {
					const result = await res.json();
					imageAssets = result.media;
				}
			} else if (tab === 'audio') {
				const res = await fetch(`/api/brand/assets/media?brandProfileId=${data.brandId}&mediaType=audio`);
				if (res.ok) {
					const result = await res.json();
					audioAssets = result.media;
				}
			} else if (tab === 'videos') {
				const res = await fetch(`/api/brand/assets/media?brandProfileId=${data.brandId}&mediaType=video`);
				if (res.ok) {
					const result = await res.json();
					videoAssets = result.media;
				}
				// Also load AI-generated videos for this brand
				const vRes = await fetch(`/api/video?brandProfileId=${data.brandId}`);
				if (vRes.ok) {
					const vResult = await vRes.json();
					brandVideos = vResult.videos || [];
				}
			}
		} catch {
			// Handle silently
		} finally {
			assetsLoading = false;
		}
	}

	function switchTab(tab: typeof activeTab) {
		activeTab = tab;
		if (tab !== 'profile') {
			loadTabAssets(tab);
		}
	}

	// Text CRUD

	async function addTextAsset() {
		if (!newTextKey || !newTextLabel || !newTextValue) return;
		try {
			const res = await fetch('/api/brand/assets/texts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandProfileId: data.brandId,
					category: newTextCategory,
					key: newTextKey,
					label: newTextLabel,
					value: newTextValue
				})
			});
			if (res.ok) {
				showAddText = false;
				selectedPresetKey = '';
				customLabel = '';
				newTextValue = '';
				await loadTabAssets('text');
				loadAssetSummary();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add text';
		}
	}

	function startEditingText(text: TextAsset) {
		editingTextId = text.id;
		editTextValue = text.value;
	}

	function cancelEditingText() {
		editingTextId = null;
		editTextValue = '';
	}

	async function saveTextAsset(textId: string) {
		try {
			const res = await fetch('/api/brand/assets/texts', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: textId, value: editTextValue })
			});
			if (res.ok) {
				editingTextId = null;
				editTextValue = '';
				await loadTabAssets('text');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save';
		}
	}

	// AI Text Generation

	async function loadAiPresets(category: string) {
		try {
			const res = await fetch(`/api/brand/assets/generate-text?category=${category}`);
			if (res.ok) {
				const result = await res.json();
				aiPresets = result.presets || [];
			}
		} catch {
			aiPresets = [];
		}
	}

	// Load presets when category changes
	$: if (showAddText && newTextCategory) {
		loadAiPresets(newTextCategory);
	}

	async function generateTextWithAI(customPrompt?: string) {
		aiGenerating = true;
		aiError = null;
		try {
			const res = await fetch('/api/brand/assets/generate-text', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandProfileId: data.brandId,
					category: newTextCategory,
					key: newTextKey || 'generated',
					label: newTextLabel || 'Generated Text',
					customPrompt: customPrompt || undefined
				})
			});
			if (res.ok) {
				const result = await res.json();
				newTextValue = result.text;
				showAiPrompt = false;
				aiCustomPrompt = '';
			} else {
				const err = await res.json().catch(() => ({ message: 'Generation failed' }));
				aiError = err.message || 'Failed to generate text';
			}
		} catch (err) {
			aiError = err instanceof Error ? err.message : 'Failed to generate text';
		} finally {
			aiGenerating = false;
		}
	}

	async function generateFromPreset(preset: { key: string; label: string; promptTemplate: string }) {
		selectedPresetKey = preset.key;
		await generateTextWithAI(preset.promptTemplate);
	}

	async function generateEditTextWithAI(textId: string, category: string, key: string, label: string, customPrompt?: string) {
		aiEditGenerating = true;
		aiError = null;
		try {
			const res = await fetch('/api/brand/assets/generate-text', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandProfileId: data.brandId,
					category,
					key,
					label,
					customPrompt: customPrompt || undefined
				})
			});
			if (res.ok) {
				const result = await res.json();
				editTextValue = result.text;
				showAiEditPrompt = false;
				aiEditCustomPrompt = '';
			} else {
				const err = await res.json().catch(() => ({ message: 'Generation failed' }));
				aiError = err.message || 'Failed to generate text';
			}
		} catch (err) {
			aiError = err instanceof Error ? err.message : 'Failed to generate text';
		} finally {
			aiEditGenerating = false;
		}
	}

	async function deleteTextAsset(textId: string) {
		try {
			const res = await fetch(`/api/brand/assets/texts?id=${textId}`, { method: 'DELETE' });
			if (res.ok) {
				await loadTabAssets('text');
				loadAssetSummary();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete';
		}
	}

	async function refreshMediaAssets() {
		await loadTabAssets(activeTab);
		loadAssetSummary();
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{profile?.brandName || 'Brand'} — Brand Profile | NebulaKit</title>
	<meta
		name="description"
		content="View and manage your brand profile, identity, visual assets, and style guide."
	/>
</svelte:head>

<div class="brand-page">
	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading your brand...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>{error}</p>
			<a href="/brand" class="back-link">← Back to Brands</a>
		</div>
	{:else if profile}
		<!-- Header -->
		<header class="brand-header">
			<div class="header-content">
				<div class="header-left">
					<a href="/brand" class="back-link">← All Brands</a>
					<h1 class="brand-title">
						{profile.brandName || 'Untitled Brand'}
					</h1>
					{#if profile.tagline}
						<p class="brand-tagline">{profile.tagline}</p>
					{/if}
				</div>
				<div class="header-actions">
					<a href="/onboarding?brand={profile.id}" class="architect-link">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
						</svg>
						Brand Architect
					</a>
				</div>
			</div>

			<!-- Progress bar -->
			<div class="completion-bar">
				<div class="completion-info">
					<span class="completion-label">Profile Completion</span>
					<span class="completion-value">{completionPercent}%</span>
				</div>
				<div class="progress-track">
					<div class="progress-fill" style="width: {completionPercent}%"></div>
				</div>
				<div class="completion-detail">
					{filledFields} of {totalFields} fields completed
				</div>
			</div>
		</header>

		<!-- Error message -->
		{#if error}
			<div class="error-banner">
				<span>{error}</span>
				<button on:click={() => (error = null)} aria-label="Dismiss error">×</button>
			</div>
		{/if}

		<!-- Tab Navigation -->
		<div class="tab-nav" role="tablist">
			<button
				class="tab-btn"
				class:active={activeTab === 'profile'}
				on:click={() => switchTab('profile')}
				role="tab"
				aria-selected={activeTab === 'profile'}
			>
				<span class="tab-icon">📋</span>
				<span class="tab-label">Profile</span>
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'text'}
				on:click={() => switchTab('text')}
				role="tab"
				aria-selected={activeTab === 'text'}
			>
				<span class="tab-icon">📝</span>
				<span class="tab-label">Text</span>
				{#if assetSummary && assetSummary.textCount > 0}
					<span class="tab-badge">{assetSummary.textCount}</span>
				{/if}
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'images'}
				on:click={() => switchTab('images')}
				role="tab"
				aria-selected={activeTab === 'images'}
			>
				<span class="tab-icon">🖼️</span>
				<span class="tab-label">Images</span>
				{#if assetSummary && assetSummary.imageCount > 0}
					<span class="tab-badge">{assetSummary.imageCount}</span>
				{/if}
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'audio'}
				on:click={() => switchTab('audio')}
				role="tab"
				aria-selected={activeTab === 'audio'}
			>
				<span class="tab-icon">🔊</span>
				<span class="tab-label">Audio</span>
				{#if assetSummary && assetSummary.audioCount > 0}
					<span class="tab-badge">{assetSummary.audioCount}</span>
				{/if}
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'videos'}
				on:click={() => switchTab('videos')}
				role="tab"
				aria-selected={activeTab === 'videos'}
			>
				<span class="tab-icon">🎬</span>
				<span class="tab-label">Videos</span>
				{#if assetSummary && (assetSummary.videoCount + assetSummary.videoGenerationsCount) > 0}
					<span class="tab-badge">{assetSummary.videoCount + assetSummary.videoGenerationsCount}</span>
				{/if}
			</button>
		</div>

		<!-- ═══ Profile Tab ═══ -->
		{#if activeTab === 'profile'}
			<div class="sections-grid">
				{#each sections as section}
					<section class="brand-section">
						<div class="section-header">
							<span class="section-icon">{section.icon}</span>
							<h2 class="section-title">{section.title}</h2>
						</div>

						<div class="fields-list">
							{#each section.fields as field (field.key)}
								<BrandFieldCard
									fieldKey={field.key}
									label={field.label}
									value={field.value}
									type={field.type}
									isEditing={editingField === field.key}
									hasTextSuggestions={!!FIELD_TO_TEXT_MAPPING[field.key]}
									editValue={editValue}
									on:edit={() => startEditing(field.key, field.value)}
									on:save={(e) => saveField(field.key, field.type, e.detail?.value)}
									on:cancel={cancelEditing}
									on:history={() => openHistory(field.key, field.label)}
									on:picktext={() => openTextPicker(field.key, field.label)}
								/>
							{/each}
						</div>
					</section>
				{/each}
			</div>

		<!-- ═══ Text Tab ═══ -->
		{:else if activeTab === 'text'}
			<div class="asset-tab">
				<div class="asset-tab-header">
					<h2 class="asset-tab-title">Brand Text Assets</h2>
					<div class="asset-tab-actions">
						{#if data.hasAIProviders}
							<button class="add-asset-btn ai" on:click={() => (showAITextGenerate = true)}>
								✨ AI Generate
							</button>
						{/if}
						<button class="add-asset-btn" on:click={() => (showAddText = !showAddText)}>
							{showAddText ? '✕ Cancel' : '+ Add Text'}
						</button>
					</div>
				</div>

				{#if showAddText}
					<div class="add-text-form">
						<div class="form-row two-col">
							<label class="form-label">
								Category
								<select bind:value={newTextCategory} on:change={() => { selectedPresetKey = ''; customLabel = ''; newTextValue = ''; }} class="form-input">
									{#each Object.entries(textCategoryInfo) as [key, info]}
										<option value={key}>{info.icon} {info.label}</option>
									{/each}
								</select>
								<span class="form-hint">{textCategoryInfo[newTextCategory]?.description}</span>
							</label>
							<label class="form-label">
								Type
								<select bind:value={selectedPresetKey} class="form-input">
									<option value="">— Pick a type —</option>
									{#each aiPresets as preset}
										<option value={preset.key}>{preset.label}</option>
									{/each}
									<option value="__custom__">✏️ Custom...</option>
								</select>
							</label>
						</div>

						{#if selectedPresetKey === '__custom__'}
							<label class="form-label">
								Name
								<input type="text" bind:value={customLabel} placeholder="e.g. Brand Anthem, Welcome Message" class="form-input" />
								{#if customLabel}
									<span class="form-hint">Key: <code>{newTextKey}</code></span>
								{/if}
							</label>
						{/if}

						{#if selectedPresetKey}
							<label class="form-label">
								Value
								<textarea bind:value={newTextValue} placeholder="Enter text content or use AI to generate..." class="form-textarea" rows="3"></textarea>
							</label>

							<!-- AI Generation Section -->
							{#if data.hasAIProviders}
								<div class="ai-generate-section">
									<div class="ai-generate-header">
										<span class="ai-label">✨ AI Generate</span>
										<div class="ai-actions-row">
											<button
												class="ai-btn"
												on:click={() => {
													if (selectedPreset) {
														generateTextWithAI(selectedPreset.promptTemplate);
													} else {
														generateTextWithAI();
													}
												}}
												disabled={aiGenerating || (selectedPresetKey === '__custom__' && !customLabel)}
												title="Auto-generate based on type and brand context"
											>
												{aiGenerating ? '⏳ Generating...' : '🪄 Auto'}
											</button>
											<button
												class="ai-btn secondary"
												on:click={() => (showAiPrompt = !showAiPrompt)}
												disabled={aiGenerating}
											>
												💬 With Prompt
											</button>
										</div>
									</div>

									{#if showAiPrompt}
										<div class="ai-prompt-area">
											<textarea
												bind:value={aiCustomPrompt}
												placeholder="Describe what you want, e.g. 'Write a catchy tagline about innovation'..."
												class="form-textarea"
												rows="2"
											></textarea>
											<button
												class="ai-btn"
												on:click={() => generateTextWithAI(aiCustomPrompt)}
												disabled={aiGenerating || !aiCustomPrompt}
											>
												{aiGenerating ? '⏳ Generating...' : '✨ Generate'}
											</button>
										</div>
									{/if}

									{#if aiError}
										<div class="ai-error">
											{aiError}
											<button class="ai-error-dismiss" on:click={() => (aiError = null)}>✕</button>
										</div>
									{/if}
								</div>
							{/if}

							<button class="save-btn" on:click={addTextAsset} disabled={!newTextKey || !newTextLabel || !newTextValue}>
								Save Text Asset
							</button>
						{/if}
					</div>
				{/if}

				{#if assetsLoading}
					<div class="loading-state small">
						<div class="spinner"></div>
					</div>
				{:else if textAssets.length === 0}
					<div class="empty-state">
						<span class="empty-icon">📝</span>
						<p>No text assets yet</p>
						<p class="empty-hint">Add brand names, taglines, bios, legal copy, and more.</p>
						{#if data.hasAIProviders}
							<button class="add-asset-btn ai empty-cta" on:click={() => (showAITextGenerate = true)}>
								✨ Generate with AI
							</button>
						{/if}
					</div>
				{:else}
					{#each Object.entries(textCategoryInfo) as [catKey, catInfo]}
						{@const catTexts = textsByCategory[catKey]}
						{#if catTexts && catTexts.length > 0}
							<div class="asset-category-group">
								<div class="asset-category-header">
									<span>{catInfo.icon}</span>
									<h3>{catInfo.label}</h3>
									<span class="category-count">{catTexts.length}</span>
								</div>
								<div class="text-assets-list">
									{#each catTexts as text}
										<div class="text-asset-card">
											<div class="text-asset-header">
												<span class="text-asset-label">{text.label}</span>
												<span class="text-asset-key">{text.key}</span>
												{#if text.language !== 'en'}
													<span class="lang-badge">{text.language}</span>
												{/if}
											</div>
											{#if editingTextId === text.id}
												<textarea
													bind:value={editTextValue}
													class="form-textarea"
													rows="3"
												></textarea>
												{#if data.hasAIProviders}
													<div class="ai-edit-row">
														<button
															class="ai-btn small"
															on:click={() => generateEditTextWithAI(text.id, text.category, text.key, text.label)}
															disabled={aiEditGenerating}
															title="Regenerate this text using AI"
														>
															{aiEditGenerating ? '⏳...' : '✨ AI Regenerate'}
														</button>
														<button
															class="ai-btn secondary small"
															on:click={() => (showAiEditPrompt = !showAiEditPrompt)}
															disabled={aiEditGenerating}
														>
															💬
														</button>
													</div>
													{#if showAiEditPrompt}
														<div class="ai-prompt-area compact">
															<textarea
																bind:value={aiEditCustomPrompt}
																placeholder="Custom instructions..."
																class="form-textarea"
																rows="2"
															></textarea>
															<button
																class="ai-btn small"
																on:click={() => generateEditTextWithAI(text.id, text.category, text.key, text.label, aiEditCustomPrompt)}
																disabled={aiEditGenerating || !aiEditCustomPrompt}
															>
																{aiEditGenerating ? '⏳...' : '✨ Generate'}
															</button>
														</div>
													{/if}
												{/if}
												<div class="text-asset-actions">
													<button class="save-btn small" on:click={() => saveTextAsset(text.id)}>Save</button>
													<button class="cancel-btn small" on:click={cancelEditingText}>Cancel</button>
												</div>
											{:else}
												<p class="text-asset-value">{text.value}</p>
												<div class="text-asset-actions">
													<button class="edit-btn" on:click={() => startEditingText(text)}>Edit</button>
													<button class="delete-btn" on:click={() => deleteTextAsset(text.id)}>Delete</button>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				{/if}
			</div>

			{#if showAITextGenerate && data.brandId}
				<AITextQuickGenerate
					brandProfileId={data.brandId}
					on:close={() => (showAITextGenerate = false)}
					on:saved={() => { showAITextGenerate = false; loadTabAssets('text'); }}
				/>
			{/if}

		<!-- ═══ Images Tab ═══ -->
		{:else if activeTab === 'images'}
			<div class="asset-tab">
				<MediaGallery
					brandProfileId={data.brandId}
					mediaType="image"
					assets={imageAssets}
					loading={assetsLoading}
					on:refresh={refreshMediaAssets}
				/>
			</div>

		<!-- ═══ Audio Tab ═══ -->
		{:else if activeTab === 'audio'}
			<div class="asset-tab">
				<MediaGallery
					brandProfileId={data.brandId}
					mediaType="audio"
					assets={audioAssets}
					loading={assetsLoading}
					on:refresh={refreshMediaAssets}
				/>
			</div>

		<!-- ═══ Videos Tab ═══ -->
		{:else if activeTab === 'videos'}
			<div class="asset-tab">
				<MediaGallery
					brandProfileId={data.brandId}
					mediaType="video"
					assets={videoAssets}
					loading={assetsLoading}
					on:refresh={refreshMediaAssets}
				/>
			</div>
		{/if}
	{/if}

	<!-- Field History Modal -->
	{#if historyFieldKey && profile}
		<BrandFieldHistory
			profileId={profile.id}
			fieldName={historyFieldKey}
			fieldLabel={historyFieldLabel || historyFieldKey}
			on:close={closeHistory}
			on:revert={handleRevert}
		/>
	{/if}

	<!-- Text Picker Modal -->
	{#if pickerFieldKey && profile}
		<BrandTextPicker
			brandProfileId={profile.id}
			fieldName={pickerFieldKey}
			fieldLabel={pickerFieldLabel || pickerFieldKey}
			on:select={handleTextPicked}
			on:close={closeTextPicker}
		/>
	{/if}
</div>

<style>
	.brand-page {
		max-width: 1060px;
		margin: 0 auto;
		padding: var(--spacing-lg) var(--spacing-md);
		min-height: calc(100vh - 60px);
	}

	/* Loading */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		gap: var(--spacing-md);
	}

	.loading-state.small {
		min-height: 200px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-state p {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}

	/* Error state */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		gap: var(--spacing-md);
		color: var(--color-text-secondary);
	}

	.back-link {
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		transition: color var(--transition-fast);
	}

	.back-link:hover {
		color: var(--color-primary-hover);
	}

	/* Header */
	.brand-header {
		margin-bottom: var(--spacing-lg);
	}

	.header-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.brand-title {
		font-size: 1.8rem;
		font-weight: 800;
		color: var(--color-text);
		margin: 0;
		line-height: 1.2;
	}

	.brand-tagline {
		color: var(--color-text-secondary);
		font-size: 1rem;
		margin: 0;
		font-style: italic;
	}

	.architect-link {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		background-color: var(--color-primary);
		color: var(--color-background);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.8rem;
		white-space: nowrap;
		transition: background-color var(--transition-fast);
	}

	.architect-link:hover {
		background-color: var(--color-primary-hover);
	}

	/* Completion bar */
	.completion-bar {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.completion-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.completion-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.completion-value {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.progress-track {
		height: 6px;
		background-color: var(--color-border);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
		border-radius: 3px;
		transition: width var(--transition-base);
	}

	.completion-detail {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		margin-top: var(--spacing-xs);
	}

	/* Error banner */
	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--color-error);
		color: var(--color-background);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-md);
		font-size: 0.85rem;
	}

	.error-banner button {
		background: none;
		border: none;
		color: var(--color-background);
		cursor: pointer;
		font-size: 1.2rem;
		padding: 0 var(--spacing-xs);
	}

	/* ─── Tab Navigation ─────────────────────────────────── */

	.tab-nav {
		display: flex;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: var(--spacing-sm) var(--spacing-md);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: all var(--transition-fast);
	}

	.tab-btn:hover {
		color: var(--color-text);
	}

	.tab-btn.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.tab-icon {
		font-size: 1rem;
	}

	.tab-badge {
		background-color: var(--color-primary);
		color: var(--color-background);
		font-size: 0.7rem;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 10px;
		min-width: 18px;
		text-align: center;
	}

	/* ─── Profile Sections Grid ──────────────────────────── */

	.sections-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-lg);
	}

	@media (min-width: 768px) {
		.sections-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.brand-section {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.section-icon {
		font-size: 1.3rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.fields-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	/* ─── Asset Tabs (shared) ────────────────────────────── */

	.asset-tab {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.asset-tab-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.asset-tab-title {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.add-asset-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		background-color: var(--color-primary);
		color: var(--color-background);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.8rem;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.add-asset-btn:hover {
		background-color: var(--color-primary-hover);
	}

	.add-asset-btn.ai {
		background-color: var(--color-surface);
		color: var(--color-primary);
		border: 1px solid var(--color-primary);
	}

	.add-asset-btn.ai:hover {
		background-color: var(--color-primary);
		color: var(--color-background);
	}

	.add-asset-btn.empty-cta {
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-lg);
		font-size: 0.9rem;
	}

	.asset-tab-actions {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-2xl) var(--spacing-md);
		text-align: center;
		color: var(--color-text-secondary);
		background-color: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
	}

	.empty-icon {
		font-size: 2.5rem;
		margin-bottom: var(--spacing-sm);
	}

	.empty-state p {
		margin: 0;
		font-size: 0.95rem;
	}

	.empty-hint {
		font-size: 0.8rem !important;
		margin-top: var(--spacing-xs) !important;
		color: var(--color-text-secondary);
	}

	/* ─── Category Groups ────────────────────────────────── */

	.asset-category-group {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
	}

	.asset-category-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.asset-category-header h3 {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
		flex: 1;
	}

	.category-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		background-color: var(--color-border);
		padding: 1px 8px;
		border-radius: 10px;
	}

	/* ─── Text Assets ────────────────────────────────────── */

	.add-text-form {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--spacing-md);
	}

	.form-row.two-col {
		grid-template-columns: 1fr 1fr;
	}

	.form-hint {
		font-size: 0.7rem;
		color: var(--color-text-secondary);
		font-weight: 400;
		margin-top: 2px;
	}

	.form-hint code {
		font-family: monospace;
		font-size: 0.7rem;
		color: var(--color-text-secondary);
		background-color: var(--color-surface);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.form-label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.form-input,
	.form-textarea {
		background-color: var(--color-background);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm);
		font-size: 0.85rem;
		font-family: inherit;
		transition: border-color var(--transition-fast);
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-textarea {
		resize: vertical;
	}

	.text-assets-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.text-asset-card {
		background-color: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.text-asset-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-xs);
	}

	.text-asset-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.text-asset-key {
		font-size: 0.7rem;
		color: var(--color-text-secondary);
		font-family: monospace;
	}

	.lang-badge {
		font-size: 0.65rem;
		font-weight: 600;
		background-color: var(--color-primary);
		color: var(--color-background);
		padding: 1px 5px;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.text-asset-value {
		font-size: 0.9rem;
		color: var(--color-text);
		margin: 0 0 var(--spacing-sm);
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.text-asset-actions {
		display: flex;
		gap: var(--spacing-xs);
	}

	/* ─── Buttons ─────────────────────────────────────────── */

	.save-btn,
	.edit-btn,
	.cancel-btn,
	.delete-btn {
		padding: var(--spacing-xs) var(--spacing-sm);
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.save-btn {
		background-color: var(--color-primary);
		color: var(--color-background);
	}

	.save-btn:hover {
		background-color: var(--color-primary-hover);
	}

	.save-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.edit-btn {
		background-color: var(--color-border);
		color: var(--color-text);
	}

	.edit-btn:hover {
		background-color: var(--color-text-secondary);
		color: var(--color-background);
	}

	.cancel-btn {
		background-color: var(--color-border);
		color: var(--color-text);
	}

	.cancel-btn:hover {
		background-color: var(--color-text-secondary);
		color: var(--color-background);
	}

	.delete-btn {
		background-color: transparent;
		color: var(--color-text-secondary);
	}

	.delete-btn:hover {
		background-color: var(--color-error);
		color: var(--color-background);
	}

	.save-btn.small,
	.cancel-btn.small {
		padding: 2px 8px;
		font-size: 0.7rem;
	}

	/* ─── AI Generate Section ─────────────────────────────── */

	.ai-generate-section {
		background-color: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.ai-generate-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.ai-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.ai-actions-row {
		display: flex;
		gap: var(--spacing-xs);
	}

	.ai-btn {
		padding: var(--spacing-xs) var(--spacing-sm);
		background-color: var(--color-primary);
		color: var(--color-background);
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color var(--transition-fast);
		white-space: nowrap;
	}

	.ai-btn:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
	}

	.ai-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ai-btn.secondary {
		background-color: var(--color-border);
		color: var(--color-text);
	}

	.ai-btn.secondary:hover:not(:disabled) {
		background-color: var(--color-text-secondary);
		color: var(--color-background);
	}

	.ai-btn.small {
		padding: 2px 8px;
		font-size: 0.7rem;
	}

	.ai-prompt-area {
		display: flex;
		gap: var(--spacing-xs);
		align-items: flex-end;
	}

	.ai-prompt-area .form-textarea {
		flex: 1;
	}

	.ai-prompt-area.compact {
		margin-top: var(--spacing-xs);
	}

	.ai-error {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		background-color: var(--color-error);
		color: var(--color-background);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
	}

	.ai-error-dismiss {
		background: none;
		border: none;
		color: var(--color-background);
		cursor: pointer;
		padding: 0;
		font-size: 0.9rem;
		line-height: 1;
	}

	.ai-edit-row {
		display: flex;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-xs);
	}

	/* ─── Responsive ──────────────────────────────────────── */

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.tab-label {
			display: none;
		}

		.tab-icon {
			font-size: 1.2rem;
		}
	}

	@media (max-width: 480px) {
		.header-content {
			flex-direction: column;
		}

		.brand-title {
			font-size: 1.4rem;
		}
	}
</style>
