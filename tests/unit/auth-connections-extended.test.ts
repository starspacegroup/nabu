import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Auth Connections API - Extended Branch Coverage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	describe('GET /api/auth/connections', () => {
		it('should require authentication', async () => {
			const mockEvent = {
				locals: {},
				platform: {}
			};

			const { GET } = await import('../../src/routes/api/auth/connections/+server');

			try {
				await GET(mockEvent as any);
				expect.fail('Should have thrown');
			} catch (err: any) {
				expect(err.status).toBe(401);
			}
		});

		it('should return empty connections when DB is not available', async () => {
			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {}
				}
			};

			const { GET } = await import('../../src/routes/api/auth/connections/+server');
			const response = await GET(mockEvent as any);
			const data = await response.json();

			expect(data.connections).toEqual([]);
		});

		it('should return 500 when database query fails', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {
						DB: {
							prepare: vi.fn().mockReturnValue({
								bind: vi.fn().mockReturnValue({
									all: vi.fn().mockRejectedValue(new Error('DB Error'))
								})
							})
						}
					}
				}
			};

			const { GET } = await import('../../src/routes/api/auth/connections/+server');

			try {
				await GET(mockEvent as any);
				expect.fail('Should have thrown');
			} catch (err: any) {
				expect(err.status).toBe(500);
			}

			consoleSpy.mockRestore();
		});

		it('should return connections from database', async () => {
			const mockConnections = [
				{ provider: 'github', provider_account_id: '12345', created_at: '2024-01-01' }
			];

			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {
						DB: {
							prepare: vi.fn().mockReturnValue({
								bind: vi.fn().mockReturnValue({
									all: vi.fn().mockResolvedValue({ results: mockConnections })
								})
							})
						}
					}
				}
			};

			const { GET } = await import('../../src/routes/api/auth/connections/+server');
			const response = await GET(mockEvent as any);
			const data = await response.json();

			expect(data.connections).toEqual(mockConnections);
		});
	});

	describe('DELETE /api/auth/connections', () => {
		it('should require authentication', async () => {
			const mockEvent = {
				locals: {},
				platform: {},
				request: {
					json: vi.fn().mockResolvedValue({ provider: 'github' })
				}
			};

			const { DELETE } = await import('../../src/routes/api/auth/connections/+server');

			try {
				await DELETE(mockEvent as any);
				expect.fail('Should have thrown');
			} catch (err: any) {
				expect(err.status).toBe(401);
			}
		});

		it('should require provider parameter', async () => {
			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {
						DB: {}
					}
				},
				request: {
					json: vi.fn().mockResolvedValue({})
				}
			};

			const { DELETE } = await import('../../src/routes/api/auth/connections/+server');

			try {
				await DELETE(mockEvent as any);
				expect.fail('Should have thrown');
			} catch (err: any) {
				expect(err.status).toBe(400);
			}
		});

		it('should return 500 when database is not available', async () => {
			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {}
				},
				request: {
					json: vi.fn().mockResolvedValue({ provider: 'github' })
				}
			};

			const { DELETE } = await import('../../src/routes/api/auth/connections/+server');

			try {
				await DELETE(mockEvent as any);
				expect.fail('Should have thrown');
			} catch (err: any) {
				expect(err.status).toBe(500);
			}
		});

		it('should not allow unlinking only connection without password', async () => {
			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {
						DB: {
							prepare: vi.fn().mockImplementation((sql: string) => {
								if (sql.includes('password_hash FROM users')) {
									return {
										bind: vi.fn().mockReturnValue({
											first: vi.fn().mockResolvedValue({ password_hash: null })
										})
									};
								}
								if (sql.includes('SELECT provider FROM oauth_accounts')) {
									return {
										bind: vi.fn().mockReturnValue({
											all: vi.fn().mockResolvedValue({ results: [{ provider: 'github' }] })
										})
									};
								}
								return {
									bind: vi.fn().mockReturnValue({ first: vi.fn(), all: vi.fn(), run: vi.fn() })
								};
							})
						}
					}
				},
				request: {
					json: vi.fn().mockResolvedValue({ provider: 'github' })
				}
			};

			const { DELETE } = await import('../../src/routes/api/auth/connections/+server');

			try {
				await DELETE(mockEvent as any);
				expect.fail('Should have thrown');
			} catch (err: any) {
				expect(err.status).toBe(400);
				expect(err.body?.message).toContain('Cannot unlink');
			}
		});

		it('should allow unlinking when user has password', async () => {
			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {
						DB: {
							prepare: vi.fn().mockImplementation((sql: string) => {
								if (sql.includes('password_hash FROM users')) {
									return {
										bind: vi.fn().mockReturnValue({
											first: vi.fn().mockResolvedValue({ password_hash: 'hashed-password' })
										})
									};
								}
								if (sql.includes('SELECT provider FROM oauth_accounts')) {
									return {
										bind: vi.fn().mockReturnValue({
											all: vi.fn().mockResolvedValue({ results: [{ provider: 'github' }] })
										})
									};
								}
								if (sql.includes('DELETE FROM oauth_accounts')) {
									return {
										bind: vi.fn().mockReturnValue({
											run: vi.fn().mockResolvedValue({ success: true })
										})
									};
								}
								return {
									bind: vi.fn().mockReturnValue({ first: vi.fn(), all: vi.fn(), run: vi.fn() })
								};
							})
						}
					}
				},
				request: {
					json: vi.fn().mockResolvedValue({ provider: 'github' })
				}
			};

			const { DELETE } = await import('../../src/routes/api/auth/connections/+server');
			const response = await DELETE(mockEvent as any);
			const data = await response.json();

			expect(data.success).toBe(true);
		});

		it('should allow unlinking when user has multiple connections', async () => {
			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {
						DB: {
							prepare: vi.fn().mockImplementation((sql: string) => {
								if (sql.includes('password_hash FROM users')) {
									return {
										bind: vi.fn().mockReturnValue({
											first: vi.fn().mockResolvedValue({ password_hash: null })
										})
									};
								}
								if (sql.includes('SELECT provider FROM oauth_accounts')) {
									return {
										bind: vi.fn().mockReturnValue({
											all: vi.fn().mockResolvedValue({
												results: [{ provider: 'github' }, { provider: 'discord' }]
											})
										})
									};
								}
								if (sql.includes('DELETE FROM oauth_accounts')) {
									return {
										bind: vi.fn().mockReturnValue({
											run: vi.fn().mockResolvedValue({ success: true })
										})
									};
								}
								return {
									bind: vi.fn().mockReturnValue({ first: vi.fn(), all: vi.fn(), run: vi.fn() })
								};
							})
						}
					}
				},
				request: {
					json: vi.fn().mockResolvedValue({ provider: 'github' })
				}
			};

			const { DELETE } = await import('../../src/routes/api/auth/connections/+server');
			const response = await DELETE(mockEvent as any);
			const data = await response.json();

			expect(data.success).toBe(true);
		});

		it('should return 500 when delete operation fails', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const mockEvent = {
				locals: {
					user: { id: 'user-1' }
				},
				platform: {
					env: {
						DB: {
							prepare: vi.fn().mockImplementation((sql: string) => {
								if (sql.includes('password_hash FROM users')) {
									return {
										bind: vi.fn().mockReturnValue({
											first: vi.fn().mockResolvedValue({ password_hash: 'hashed-password' })
										})
									};
								}
								if (sql.includes('SELECT provider FROM oauth_accounts')) {
									return {
										bind: vi.fn().mockReturnValue({
											all: vi.fn().mockResolvedValue({ results: [{ provider: 'github' }] })
										})
									};
								}
								if (sql.includes('DELETE FROM oauth_accounts')) {
									return {
										bind: vi.fn().mockReturnValue({
											run: vi.fn().mockRejectedValue(new Error('Delete failed'))
										})
									};
								}
								return {
									bind: vi.fn().mockReturnValue({ first: vi.fn(), all: vi.fn(), run: vi.fn() })
								};
							})
						}
					}
				},
				request: {
					json: vi.fn().mockResolvedValue({ provider: 'github' })
				}
			};

			const { DELETE } = await import('../../src/routes/api/auth/connections/+server');

			try {
				await DELETE(mockEvent as any);
				expect.fail('Should have thrown');
			} catch (err: any) {
				expect(err.status).toBe(500);
			}

			consoleSpy.mockRestore();
		});
	});
});
