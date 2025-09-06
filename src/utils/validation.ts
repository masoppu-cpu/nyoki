/**
 * 入力バリデーションユーティリティ
 */

/**
 * メールアドレスのバリデーション
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * パスワードのバリデーション
 * @returns エラーメッセージまたはnull
 */
export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'パスワードは6文字以上で入力してください';
  }
  
  // 必要に応じて追加の検証を有効化
  // if (!/[A-Za-z]/.test(password)) {
  //   return 'パスワードに英字を含めてください';
  // }
  // if (!/[0-9]/.test(password)) {
  //   return 'パスワードに数字を含めてください';
  // }
  
  return null;
};

/**
 * 名前のバリデーション
 */
export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return 'お名前を入力してください';
  }
  
  if (name.trim().length < 2) {
    return 'お名前は2文字以上で入力してください';
  }
  
  if (name.trim().length > 50) {
    return 'お名前は50文字以内で入力してください';
  }
  
  return null;
};

/**
 * 植物名のバリデーション
 */
export const validatePlantName = (name: string): string | null => {
  if (!name.trim()) {
    return '植物の名前を入力してください';
  }
  
  if (name.trim().length > 100) {
    return '植物の名前は100文字以内で入力してください';
  }
  
  return null;
};

/**
 * URLのバリデーション
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 日付のバリデーション
 */
export const validateDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * 電話番号のバリデーション（日本）
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // 日本の電話番号形式（ハイフンあり・なし両対応）
  const re = /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/;
  return re.test(phone.replace(/[^\d-]/g, ''));
};

/**
 * 郵便番号のバリデーション（日本）
 */
export const validatePostalCode = (code: string): boolean => {
  // 日本の郵便番号形式（ハイフンあり・なし両対応）
  const re = /^\d{3}-?\d{4}$/;
  return re.test(code);
};