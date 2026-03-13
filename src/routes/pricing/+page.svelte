<script lang="ts">
	import PricingSection from '$lib/components/PricingSection.svelte';

	export let data: { user: App.Locals['user'] };
</script>

<svelte:head>
	<title>Pricing — Nabu</title>
	<meta
		name="description"
		content="Simple, per-brand pricing for Nabu. Start free and pick a plan for each brand independently."
	/>
</svelte:head>

<PricingSection isLoggedIn={!!data.user} />
