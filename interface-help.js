// Inline help for every interactive surface of Reproductive System.
// Delegated listeners also cover dialogs and dynamic cards created after setup.
// Descriptions and examples are UI-only. They are never added to model prompts.
const HELP = Object.freeze({
  'repro-enabled': 'Включает или выключает отслеживание для текущей истории. Когда выключено, расширение не добавляет новые игровые данные в контекст модели.',
  'repro-notify': 'Показывает небольшие уведомления о событиях: изменении цикла, беременности и других зафиксированных фактах.',
  'repro-trackfor': 'Чьё состояние отслеживать: только твою персону, только активного персонажа или обоих. Например, «Обоих» — два отдельных состояния.',
  'repro-carrier-mode': 'Кто может вынашивать беременность. Это настройка способностей участников, а не утверждение, что кто-то уже беременен.',
  'rp-open-profiles': 'Открывает подробные особенности персоны и персонажа: вид, тип цикла, фертильность, течку/гон и правила беременности. Обычно достаточно настроить один раз.',
  'repro-hidden-preg': 'Пока беременность не подтверждена тестом или фактом сцены, персонажи не узнают о ней автоматически. Беременность продолжает отслеживаться.',
  'repro-realism': 'Учитывает новые сюжетные события, способные сдвинуть цикл. Ощущения и настроение при месячных остаются только необязательными подсказками в интерфейсе, не указаниями модели.',
  'repro-partner-cycle-day': 'День цикла активного персонажа. Например: 12. Не меняет день цикла твоей персоны.',
  'repro-partner-cycle-set': 'Сохраняет введённый день цикла активного персонажа.',
  'repro-contraception-user': 'Какой способ защиты используется у твоей персоны сейчас. Например, «Таблетки». Изменяет расчёт вероятности зачатия, не описывает сцену самостоятельно.',
  'repro-contraception-char': 'Способ защиты, указанный для активного персонажа. Например, «Презерватив».',
  'repro-duration': 'Полный срок беременности в неделях. Например, 40 для обычного срока, 12 для короткого фантастического.',
  'repro-duration-custom': 'Свой полный срок беременности, от 4 до 100 недель. Например: 24.',
  'repro-baby-max-age': 'До какого возраста ребёнок отображается в подробном блоке ухода. Позже он остаётся в семье и истории.',
  'repro-cycleday': 'Текущий день цикла твоей персоны. Например: 20 при цикле длиной 28 дней.',
  'repro-setcycle': 'Применить введённый день цикла к текущему состоянию персоны.',
  'repro-family-tree-btn': 'Открывает схему семьи с родителями, детьми, возрастом и известными сюжетными фактами.',
  'repro-force-birth-btn': 'Отмечает только уже состоявшиеся в сюжете роды. Откроется окно именования ребёнка, беременность завершится. Не используй для планируемых родов.',
  'repro-manual-toggle': 'Вручную задать уже существующую в сюжете беременность. Укажи носителя, сюжетную дату зачатия и количество плодов.',
  'repro-open-baby': 'Добавить ребёнка, который уже существует в истории, без автоматического запуска родов. Например: имя, возраст 2 года, второй родитель.',
  'repro-manual-who': 'Кого касается добавляемая беременность: твою персону или активного персонажа.',
  'repro-manual-conception-date': 'Дата зачатия по времени сюжета, а не сегодняшняя реальная дата. Например: 2026-10-09.',
  'repro-manual-fetus': 'Количество плодов в новой беременности от 1 до 4. Например: 1.',
  'repro-manual-sex': 'Пол плодов для ручной беременности. Можно оставить случайный вариант, если он ещё не известен.',
  'repro-manual-second-parent': 'Имя второго родителя в этой беременности. Например: Юкио Окумура. Можно оставить пустым, если неизвестно.',
  'repro-manual-start': 'Записывает беременность в текущую историю с указанными параметрами. Изменение влияет на сюжетный трекер.',
  'repro-mb-name': 'Имя ребёнка, которого нужно добавить. Например: Аки.',
  'repro-mb-sex': 'Пол добавляемого ребёнка — сюжетный факт для его карточки.',
  'repro-mb-age-days': 'Возраст ребёнка числом. Например: 2, если справа выбрано «лет».',
  'repro-mb-age-unit': 'Единица возраста: дни, месяцы или годы. Например: «2» + «лет».',
  'repro-mb-father': 'Второй родитель ребёнка; необязательно. Например: Юкио Окумура.',
  'repro-mb-personality': 'Только уже известные черты характера, через запятую. Например: любопытный, осторожный.',
  'repro-mb-appearance': 'Только установленные особенности внешности, через запятую. Например: тёмные волосы, голубые глаза.',
  'repro-manual-baby-add': 'Добавляет ребёнка в историю и семейное древо. Существующие дети сохраняются.',
  'repro-reset': 'Сбрасывает беременность. Это действие изменяет сюжетные данные; появится подтверждение.',
  'repro-reset-baby': 'Удаляет данные текущего младенца после подтверждения.',
  'repro-undo': 'Возвращает последнее удаление или сброс, если оно сохранено в истории отмены расширения.',
  'repro-css-toggle': 'Открывает редактор CSS сводки в сообщениях чата. Для обычной игры этот раздел не нужен.',
  'repro-custom-css': 'Собственные CSS-правила для сводки в чате. Пример: details.repro { border-radius: 8px; }. Внешний вид панели настроек не меняется.',
  'repro-css-apply': 'Применяет написанный CSS к сводкам в чате.',
  'repro-css-reset': 'Возвращает стандартное оформление сводки в чате.',
  'repro-theme-btn': 'Открывает внешний вид дополнительных окон. Все цвета всё равно наследуются из активной темы SillyTavern.',
  'repro-infoblock': 'Где показывать сводку состояния в сообщениях: вверху, внизу или не показывать.',
  'repro-light-mode': 'Изменяет лишь смешивание поверхностей внутри расширения, сохраняя цвета текущей темы Tavern. Не переключает общую тему сайта.',
  'repro-purge-tags': 'Переносит технические метки из видимого текста сообщений в служебные данные. Расширение продолжает их читать; действие требует подтверждения.',
  'repro-set-weeks': 'Текущий срок беременности в неделях. Например: 6.',
  'repro-apply-weeks': 'Сохраняет введённый срок беременности без изменения даты зачатия.',
  'repro-reanchor-btn': 'Заново рассчитывает срок беременности по сюжетной дате зачатия и текущему времени истории.',
  'repro-doctor-btn': 'Зафиксировать отыгранное обращение к врачу по текущему осложнению.',
  'repro_wand_open': 'Быстро открыть панель событий расширения, не переходя к полным настройкам.',
  'rp-quick-cycleday': 'Быстро изменить текущий день цикла персоны. Например: 20.',
  'rp-quick-hygiene': 'Отметить средство гигиены, если это важно для твоей истории. Самочувствие и действия остаются на усмотрение игрока.',
  'rp-profile-dialog': 'Подробные параметры организма персонажей и игровой симуляции. Настройки сохраняются автоматически.',
});
const FIELD = Object.freeze({
  race: 'Вид или раса персонажа. Пример: человек, демон, зверочеловек. Название не назначает физиологические параметры автоматически.',
  cycleType: 'Какой цикл есть у персонажа: с менструацией, без кровотечения, с течкой либо никакого.',
  cycleLength: 'Длина полного цикла в сюжетных днях. Например: 28. Пресеты ниже устанавливают число автоматически.',
  periodDays: 'Сколько первых дней цикла происходит кровотечение. Например: 5. Это календарный параметр, не указание на настроение или ощущения.',
  compatible: 'Разрешено ли зачатие между текущими участниками по правилам вашей истории.',
  health: 'Только известные по сюжету факты о здоровье. Например: аллергия на лекарство. Не добавляй непроверенные диагнозы.',
  humanComplications: 'Можно ли использовать обычный список осложнений беременности. Дополнительные варианты можно задать отдельно.',
  nextVisit: 'Дата следующего обследования внутри истории. Пример: 2026-11-15.',
  doctor: 'Имя ведущего врача в сюжете. Например: доктор Сато.',
  load: 'Нагрузка на организм во время беременности по игровой шкале от 0 до 100. Высокое значение увеличивает риск осложнений.',
  maternalMortality: 'Разрешить фиксацию гибели вынашивающего персонажа, только если она уже состоялась по сюжету. Не вызывает случайную смерть.',
  readingSize: 'Размер текста в интерфейсе расширения: 16, 18 или 20 пикселей.',
  'heat.enabled': 'Включить течку у этого персонажа. Не зависит от старых омегаверсных ролей.',
  'rut.enabled': 'Включить гон у этого персонажа. Не зависит от старых омегаверсных ролей.',
  'heat.mode': 'Когда возникает течка: в указанные дни цикла или раз в год по сюжетному календарю.',
  'rut.mode': 'Когда возникает гон: в указанные дни цикла или раз в год по сюжетному календарю.',
  'heat.start': 'Первый день течки внутри цикла. Например: 12.',
  'rut.start': 'Первый день гона внутри цикла. Например: 12.',
  'heat.date': 'Дата начала сезонной течки в формате ММ-ДД. Пример: 03-01 означает 1 марта.',
  'rut.date': 'Дата начала сезонного гона в формате ММ-ДД. Пример: 03-01.',
  'heat.duration': 'Продолжительность течки в сюжетных днях. Например: 3.',
  'rut.duration': 'Продолжительность гона в сюжетных днях. Например: 3.',
  'heat.chance': 'Шанс зачатия во время течки в процентах. Например: 90.',
  'heat.outside': 'Шанс зачатия вне течки. Например: 5 %. Выбор 0 % означает невозможность зачатия вне течки.',
  'rut.chanceMode': 'Как гон влияет на шанс зачатия: умножает существующий шанс либо заменяет его фиксированным.',
  'rut.multiplier': 'Коэффициент изменения шанса при гоне. Например: 2 означает шанс вдвое выше.',
  'rut.chance': 'Фиксированный шанс в процентах, применяемый во время гона при соответствующем режиме.',
  chance0: 'Вероятность первого осложнения в текущем триместре. Игровая величина, не медицинская статистика.',
  chance1: 'Вероятность второго осложнения, если уже выпало первое.',
  chance2: 'Вероятность третьего осложнения, если уже выпали первые два.',
});
const ACTION = Object.freeze({
  screen: 'Отмечает обследование, которое уже произошло в сюжете. Результат записывается один раз.',
  load: 'Применяет указанную нагрузку к текущей беременности.',
  complete: 'Помечает текущее событие потери или спасения как физически завершённое, если это подтверждено сюжетом.',
  frozen: 'Ручная установка замершей беременности — тяжёлое событие. Выполняй только если оно уже произошло в истории; потребуется подтверждение.',
});

const ZONES = '.reproductive-system-settings, #rp-profile-dialog, #rp-quick-overlay, #rp-tree-overlay, #repro-birth-overlay, #rp-theme-overlay, .rg-overlay, details.repro, #custom-notification-container, #repro_wand_open';
const INTERACTIVE = 'button, input, select, textarea, summary, [role="button"], .menu_button, .checkbox_label, [tabindex]:not([tabindex="-1"])';
let installed = false;
let current = null;
let tooltip = null;
let savedDescription = '';

function controlLabel(el) {
  const labelled = el.getAttribute('aria-label') || (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent : '') || el.closest('label')?.textContent || el.textContent || el.getAttribute('placeholder') || '';
  return String(labelled).replace(/\s+/g, ' ').trim().slice(0, 110);
}
function helpText(el) {
  if (el.hasAttribute('data-rp-help')) return el.dataset.rpHelp;
  if (HELP[el.id]) return HELP[el.id];
  if (el.dataset.field && FIELD[el.dataset.field]) return FIELD[el.dataset.field];
  if (el.dataset.action && ACTION[el.dataset.action]) return ACTION[el.dataset.action];
  if (el.dataset.customTags) return 'Добавить свои проявления течки или гона. Формат: Название | описание, по одной записи на строку. Например: Жар | кожа становится горячей.';
  if (el.hasAttribute('data-custom-complications')) return 'Добавить редкие осложнения. Формат: Название | проявления | триместры. Пример: Спазмы | боли внизу живота | 1,2.';
  if (el.dataset.tag) return 'Разрешить это проявление во время течки или гона. Модель может описать его только по контексту сцены.';
  if (el.dataset.catalog) return 'Включить или исключить этот вид осложнений из списка возможных игровых исходов.';
  if (el.dataset.rpView) return ({state:'Просмотр текущего состояния персонажей: цикл, беременность, дети.',settings:'Основные параметры отслеживания и физиологии персонажей.',tools:'Сюжетные события, семья и дополнительные настройки.'})[el.dataset.rpView] || '';
  if (el.dataset.who) return 'Переключает подробные настройки между твоей персоной и активным персонажем. Данные хранятся отдельно.';
  if (el.dataset.days) return `Установить ${el.dataset.days} сюжетных дней вместо ручного ввода.`;
  if (el.dataset.chance) return `Установить шанс ${el.dataset.chance} % вне течки.`;
  if (el.hasAttribute('data-close')) return 'Закрыть текущее окно; сохранённые настройки останутся.';
  if (el.hasAttribute('data-rp-help-original-title')) return el.dataset.rpHelpOriginalTitle;
  const label = controlLabel(el);
  const example = el.getAttribute('placeholder');
  if (el.matches('input, textarea') && example) return `Поле «${label || 'значение'}». Пример или формат: ${example}. Настройка сохраняется по мере ввода или после подтверждения.`;
  if (el.matches('input[type="checkbox"]') || el.closest('.checkbox_label')) return `Переключатель «${label || controlLabel(el.closest('label') || el)}». Положение и подпись «Вкл./Выкл.» показывают текущее состояние.`;
  if (el.matches('select')) return `Выбери подходящее значение для «${label || 'параметра'}». Изменение действует для текущего персонажа или истории.`;
  if (el.matches('input, textarea')) return `Измени «${label || 'значение'}». Используй факты своей истории, необязательные поля можно оставить пустыми.`;
  if (el.matches('button, summary, .menu_button, [role="button"]')) return `Открывает или выполняет действие «${label || 'этот пункт'}» в текущей истории.`;
  return '';
}
function ensureTooltip() {
  if (tooltip && tooltip.isConnected) return tooltip;
  tooltip = document.createElement('div');
  tooltip.id = 'rp-interface-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('popover', 'manual');
  document.body.append(tooltip);
  return tooltip;
}
function position() {
  if (!current || !tooltip) return;
  const rect = current.getBoundingClientRect();
  const width = tooltip.offsetWidth || 320;
  const height = tooltip.offsetHeight || 80;
  const left = Math.max(10, Math.min(rect.left, window.innerWidth - width - 10));
  const below = rect.bottom + 9;
  const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, rect.top - height - 9);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
function dismiss() {
  if (!current) return;
  if (savedDescription) current.setAttribute('aria-describedby', savedDescription);
  else current.removeAttribute('aria-describedby');
  current = null;
  savedDescription = '';
  if (tooltip?.matches(':popover-open')) tooltip.hidePopover();
  else if (tooltip) tooltip.hidden = true;
}
function show(el) {
  if (el === current) return;
  dismiss();
  if (!el || !el.closest(ZONES)) return;
  if (el.hasAttribute('title')) {
    el.dataset.rpHelpOriginalTitle = el.getAttribute('title');
    el.removeAttribute('title'); // no second native tooltip
  }
  const hint = helpText(el);
  if (!hint) return;
  current = el;
  const tip = ensureTooltip();
  tip.textContent = hint;
  savedDescription = el.getAttribute('aria-describedby') || '';
  el.setAttribute('aria-describedby', savedDescription ? `${savedDescription} ${tip.id}` : tip.id);
  tip.hidden = false;
  try { if (!tip.matches(':popover-open') && typeof tip.showPopover === 'function') tip.showPopover(); } catch {}
  requestAnimationFrame(position);
}
function candidate(target) { return target instanceof Element ? target.closest(INTERACTIVE) : null; }
export function installInterfaceHelp() {
  if (installed) return;
  installed = true;
  document.addEventListener('pointerover', e => { if(e.pointerType !== 'touch') show(candidate(e.target)); }, true);
  document.addEventListener('pointerout', e => {
    if (current && e.target instanceof Element && (e.target === current || current.contains(e.target)) && !current.contains(e.relatedTarget)) dismiss();
  }, true);
  document.addEventListener('focusin', e => show(candidate(e.target)), true);
  document.addEventListener('focusout', e => { if (current && e.target === current) dismiss(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') dismiss(); }, true);
  document.addEventListener('scroll', dismiss, true);
  window.addEventListener('resize', dismiss);
  document.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') show(candidate(e.target)); }, true);
}
