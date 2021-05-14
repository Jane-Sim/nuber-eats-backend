/**
 * mail module에서 사용할 options 인터페이스
 */
export interface MailModuleOptions {
  apiKey: string;
  domain: string;
  fromEmail: string;
}

// 이메일 변수를 담을 interface
export interface EmailVar {
  key: string;
  value: string;
}
