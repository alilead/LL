import { test, expect } from '@playwright/test';

test.describe('Lead Management System Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Her test öncesi login ol
    await page.goto('http://localhost:5173');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Dashboard'a yönlendirildiğini kontrol et
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should create a new lead', async ({ page }) => {
    // Yeni lead oluştur
    await page.click('text=New Lead');
    await page.fill('input[name="title"]', 'Test Lead');
    await page.fill('textarea[name="description"]', 'Test Lead Description');
    await page.selectOption('select[name="stage"]', 'new');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:text("Save")');

    // Lead'in oluşturulduğunu kontrol et
    await expect(page.locator('text=Test Lead')).toBeVisible();
  });

  test('should add task to lead', async ({ page }) => {
    // Lead detaylarına git
    await page.click('text=Test Lead');
    
    // Yeni görev ekle
    await page.click('text=Add Task');
    await page.fill('input[name="title"]', 'Test Task');
    await page.fill('textarea[name="description"]', 'Test Task Description');
    await page.fill('input[name="due_date"]', '2024-12-31');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:text("Save")');

    // Görevin eklendiğini kontrol et
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should add note to lead', async ({ page }) => {
    // Lead detaylarına git
    await page.click('text=Test Lead');
    
    // Yeni not ekle
    await page.click('text=Add Note');
    await page.fill('textarea[name="content"]', 'Test Note Content');
    await page.click('button:text("Save")');

    // Notun eklendiğini kontrol et
    await expect(page.locator('text=Test Note Content')).toBeVisible();
  });

  test('should add activity to lead', async ({ page }) => {
    // Lead detaylarına git
    await page.click('text=Test Lead');
    
    // Yeni aktivite ekle
    await page.click('text=Add Activity');
    await page.selectOption('select[name="type"]', 'call');
    await page.fill('textarea[name="description"]', 'Test Call Activity');
    await page.click('button:text("Save")');

    // Aktivitenin eklendiğini kontrol et
    await expect(page.locator('text=Test Call Activity')).toBeVisible();
  });

  test('should update lead stage', async ({ page }) => {
    // Lead detaylarına git
    await page.click('text=Test Lead');
    
    // Lead aşamasını güncelle
    await page.click('text=Change Stage');
    await page.selectOption('select[name="stage"]', 'qualified');
    await page.click('button:text("Save")');

    // Aşamanın güncellendiğini kontrol et
    await expect(page.locator('text=Qualified')).toBeVisible();
  });

  test('should filter leads', async ({ page }) => {
    // Ana sayfaya git
    await page.click('text=Leads');
    
    // Filtreleri uygula
    await page.selectOption('select[name="stage"]', 'qualified');
    await page.selectOption('select[name="priority"]', 'high');
    
    // Filtrelenmiş sonuçları kontrol et
    await expect(page.locator('text=Test Lead')).toBeVisible();
  });

  test('should search leads', async ({ page }) => {
    // Ana sayfaya git
    await page.click('text=Leads');
    
    // Arama yap
    await page.fill('input[name="search"]', 'Test Lead');
    await page.press('input[name="search"]', 'Enter');
    
    // Arama sonuçlarını kontrol et
    await expect(page.locator('text=Test Lead')).toBeVisible();
  });

  test('should delete lead', async ({ page }) => {
    // Lead detaylarına git
    await page.click('text=Test Lead');
    
    // Lead'i sil
    await page.click('text=Delete Lead');
    await page.click('button:text("Confirm")');

    // Lead'in silindiğini kontrol et
    await expect(page.locator('text=Test Lead')).not.toBeVisible();
  });
});
