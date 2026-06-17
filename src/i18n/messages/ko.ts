import type { MessageCatalog } from '../types';
import { UI_KO } from './ui.ko';
import { MODULES_KO } from './modules.ko';
import { SECONDARY_KO } from './secondary.ko';
import { TERTIARY_KO } from './tertiary.ko';

export const ko: MessageCatalog = {
  ...UI_KO,
  ...MODULES_KO,
  ...SECONDARY_KO,
  ...TERTIARY_KO,
  'common.search': '검색…',
  'common.cancel': '취소',
  'common.save': '저장',
  'common.close': '닫기',

  'language.title': '언어 선택',
  'language.search': '언어 검색…',
  'language.current': '현재 언어',
  'language.hint': '5개 언어 지원: 프랑스어, 영어, 스페인어, 독일어, 한국어.',
  'language.translating': '인터페이스를 불러오는 중…',

  'preferences.title': '환경설정',
  'preferences.subtitle': '캘린더, 언어 및 동기화',
  'preferences.language': '앱 언어',
  'preferences.languageHint': '인터페이스 및 메뉴',
  'preferences.calendarSync': '기기 캘린더 동기화',
  'preferences.calendarSyncHint': 'iOS/Android 캘린더에 경기 및 소집 일정',
  'preferences.syncNow': '지금 동기화',
  'preferences.neverSynced': '동기화 안 됨',
  'preferences.syncedJustNow': '방금',
  'preferences.syncedMinutes': '{{n}}분 전',
  'preferences.syncedHours': '{{n}}시간 전',
  'preferences.syncedDays': '{{n}}일 전',
  'preferences.syncDisabled': '동기화 비활성화',
  'preferences.syncDisabledBody': '계속하려면 캘린더 동기화를 활성화하세요.',
  'preferences.syncOk': '캘린더 동기화됨',
  'preferences.syncOkBody': '{{n}}개 일정이보내졌습니다.',
  'preferences.syncPermission': '권한 필요',
  'preferences.syncPermissionBody': '기기 설정에서 ProDay의 캘린더 접근을 허용하세요.',
  'preferences.syncEmpty': '동기화할 항목 없음',
  'preferences.syncEmptyBody': '예정된 일정이 아직 없습니다.',
  'preferences.syncError': '동기화에 실패했습니다. 나중에 다시 시도하세요.',

  'profile.chapters.account': '계정',
  'profile.chapters.showcase': '쇼케이스',
  'profile.chapters.career': '경력',
  'profile.chapters.activity': '활동',
  'profile.chapters.settings': '설정',

  'nav.overflow': '탐색',

  'tabs.home': '홈',
  'tabs.recrutement': '이적',
  'tabs.matchs': '경기',
  'tabs.covoiturage': '카풀',
  'tabs.sante': '건강',
  'tabs.feed': '피드',
  'tabs.reels': '릴스',
  'tabs.messages': '메시지',
  'tabs.profil': '프로필',
  'tabs.shop': '샵',
};
