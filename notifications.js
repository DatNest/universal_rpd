// ═══════════════════════════════════════════
// NOTIFICATIONS — всплывающие уведомления
// ═══════════════════════════════════════════

import { getSettings } from './state.js';

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function initCustomNotifications() {
    if ($('#custom-notification-container').length > 0) return;

    $('body').append('<div id="custom-notification-container"></div>');

    // Visual rules are maintained in the single extension style.css.
}

export function showNotification(message, type = 'info') {
    const s = getSettings();
    if (!s.showNotifications) return;

    initCustomNotifications();

    const container = $('#custom-notification-container');
    const notification = $(`
        <div class="custom-notification ${type}">
            <button class="close-btn">×</button>
            <div>${message}</div>
        </div>
    `);

    container.append(notification);

    notification.find('.close-btn').on('click', function() {
        notification.css('animation', 'slideOut 0.3s ease-in');
        setTimeout(() => notification.remove(), 300);
    });

    setTimeout(() => {
        notification.css('animation', 'slideOut 0.3s ease-in');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ── Birth dialog — congratulations + name input + generated traits ──

// Pool of UNIQUE traits — rolled at 10% chance per baby, otherwise null.
const SPECIAL_TRAITS = [
    { name: 'гетерохромия', desc: 'разноцветные глаза', icon: 'fa-eye' },
    { name: 'близнецовая связь', desc: 'эмпатическая связь с братом/сестрой', icon: 'fa-link' },
    { name: 'музыкальный слух', desc: 'идеально различает ноты с младенчества', icon: 'fa-music' },
    { name: 'абсолютная память', desc: 'запоминает всё с первого раза', icon: 'fa-brain' },
    { name: 'родимое пятно-знак', desc: 'необычная отметина при рождении', icon: 'fa-star' },
    { name: 'редкая группа крови', desc: 'AB(IV) Rh−', icon: 'fa-droplet' },
    { name: 'необычный цвет глаз', desc: 'фиалковые / янтарные / серебристые', icon: 'fa-eye' },
    { name: 'шестой палец', desc: 'полидактилия — лишний пальчик на руке', icon: 'fa-hand' },
    { name: 'белая прядь', desc: 'седая прядь волос с рождения', icon: 'fa-feather' },
    { name: 'необычно спокойный', desc: 'почти не плачет, мудрый взгляд', icon: 'fa-moon' },
    { name: 'крепкое здоровье', desc: 'не болеет даже в эпидемии', icon: 'fa-shield-heart' },
    { name: 'природный талант', desc: 'к рисованию / спорту / языкам', icon: 'fa-palette' },
];

function rollSpecialTrait(chancePercent = 10) {
    if (Math.random() * 100 >= chancePercent) return null;
    return SPECIAL_TRAITS[Math.floor(Math.random() * SPECIAL_TRAITS.length)];
}

// Fallback random pools — used only if model didn't provide traits via tag
function generateTraits() {
    const traits = [
        'спокойный', 'крикливый', 'любопытный', 'улыбчивый', 'серьёзный',
        'активный', 'сонливый', 'упрямый', 'ласковый', 'непоседливый',
        'тихий', 'весёлый', 'чувствительный', 'капризный', 'общительный',
    ];
    const pick = (arr, n) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
    };
    return {
        personality: pick(traits, 2),
        appearance: [],
        special: null,
    };
}

export function showBirthDialog(babies, onConfirm) {
    // Remove any existing dialog
    $('#repro-birth-overlay').remove();

    let babiesHtml = '';
    const traitsData = [];

    babies.forEach((baby, i) => {
        const isF = baby.sex === 'F';
        const sexIcon = isF ? '♀' : '♂';
        const sexText = isF ? 'девочка' : 'мальчик';
        const sxCls = isF ? 'f' : 'm';

        // Use model-provided traits if present (parsed from [BABY_TRAITS:{...}] tag),
        // Only personality has a random fallback. Appearance needs supplied facts.
        const fallback = generateTraits();
        const personality = (Array.isArray(baby.personality) && baby.personality.length)
            ? baby.personality : fallback.personality;
        const appearance = (Array.isArray(baby.appearance) && baby.appearance.length)
            ? baby.appearance : fallback.appearance;
        const special = baby.special !== undefined ? baby.special : fallback.special;
        const fatherName = baby.fatherName || '';

        traitsData.push({ personality, appearance, special, fatherName });

        const fatherHtml = fatherName
            ? `<div class="rb-trait-section">
                    <span class="rb-trait-label"><i class="fa-solid fa-person"></i>Второй родитель:</span>
                    <span class="rb-trait-values">${escapeHtml(fatherName)}</span>
               </div>` : '';

        const specialHtml = special
            ? `<div class="rb-special">
                    <i class="fa-solid ${special.icon || 'fa-star'}"></i>
                    <span class="rb-special-name">${escapeHtml(special.name)}</span>
                    <span class="rb-special-desc">— ${escapeHtml(special.desc)}</span>
               </div>` : '';

        babiesHtml += `
        <div class="rb-baby-card">
            <div class="rb-baby-head">
                <div class="rb-sex-icon ${sxCls}">${sexIcon}</div>
                <div class="rb-sex-text ${sxCls}">У вас ${sexText}</div>
            </div>
            <input type="text" class="rb-name-input" data-idx="${i}"
                   placeholder="Введите имя…" autocomplete="off"
                   value="${escapeHtml(baby.name || '')}">
            <div class="rb-traits">
                ${fatherHtml}
                <div class="rb-trait-section">
                    <span class="rb-trait-label"><i class="fa-solid fa-brain"></i>Характер:</span>
                    <span class="rb-trait-values">${escapeHtml(personality.join(', '))}</span>
                </div>
                <div class="rb-trait-section">
                    <span class="rb-trait-label"><i class="fa-solid fa-eye"></i>Внешность:</span>
                    <span class="rb-trait-values">${escapeHtml(appearance.length ? appearance.join(', ') : 'Пока не указана')}</span>
                </div>
            </div>
            ${specialHtml}
        </div>`;
    });

    const multiText = babies.length > 1
        ? `<div class="rb-multi">${babies.length === 2 ? 'двойня' : babies.length === 3 ? 'тройня' : babies.length + ' малышей'}</div>`
        : '';

    const overlay = $(`
    <div id="repro-birth-overlay">
        <div class="rb-dialog">
            <div class="rb-header">
                <div class="rb-header-icon"><i class="fa-solid fa-baby"></i></div>
                <span class="rb-header-title">Поздравляем!</span>
                ${multiText}
            </div>
            <div class="rb-babies">${babiesHtml}</div>
            <button class="rb-confirm-btn">
                <i class="fa-solid fa-heart"></i>Подтвердить
            </button>
        </div>
    </div>`);

    $('body').append(overlay);

    // Focus first name input
    setTimeout(() => overlay.find('.rb-name-input').first().focus(), 100);

    // Confirm button
    overlay.find('.rb-confirm-btn').on('click', () => {
        const names = [];
        overlay.find('.rb-name-input').each(function() {
            names.push($(this).val().trim());
        });
        overlay.css('animation', 'rbFadeOut 0.3s ease');
        overlay.find('.rb-dialog').css('animation', 'rbSlideOut 0.3s ease');
        setTimeout(() => {
            overlay.remove();
            if (onConfirm) onConfirm(names, traitsData);
        }, 280);
    });

    // Enter key to confirm
    overlay.on('keydown', (e) => {
        if (e.key === 'Enter') overlay.find('.rb-confirm-btn').click();
    });
}

// ─── Graduation dialog: «Ваш малыш уже большой» с конфетти ───
// graduates — массив baby-объектов которые выпускаются
// onConfirm(graduates) — колбэк после подтверждения
export function showGraduationDialog(graduates, onConfirm) {
    if (!graduates || graduates.length === 0) {
        if (onConfirm) onConfirm([]);
        return;
    }

    // The graduation dialog and confetti use the shared theme-native style.css.

    const sexIcon = (s) => s === 'M' ? '<span class="rg-sex-icon rp-theme-colour">♂</span>'
                       : s === 'F' ? '<span class="rg-sex-icon rp-theme-colour">♀</span>'
                       : '';
    const namesHtml = graduates.map(b => `${sexIcon(b.sex)}${escapeHtml(b.name || 'малыш')}`).join(', ');

    const single = graduates.length === 1;
    const title = single ? 'Ваш малыш уже большой!' : 'Ваши малыши уже большие!';
    const subtitle = single
        ? 'Время летит... отслеживание младенческих параметров больше не требуется. Конечно, ребёнок остаётся с вами — просто из инфоблока убираем подгузники и колики.'
        : 'Время летит... отслеживание младенческих параметров больше не требуется. Конечно, дети остаются с вами — просто из инфоблока убираем подгузники и колики.';

    const overlay = $(`<div class="rg-overlay"></div>`);
    const card = $(`
        <div class="rg-card" tabindex="0">
            <div class="rg-icon"><i class="fa-solid fa-child-reaching"></i></div>
            <div class="rg-title">🎉 ${title}</div>
            <div class="rg-subtitle">${subtitle}</div>
            <div class="rg-names">${namesHtml}</div>
            <button class="rg-btn rg-confirm">Понятно ✨</button>
        </div>
    `);
    overlay.append(card);
    $('body').append(overlay);
    card.focus();

    // Запускаем конфетти
    const cardEl = card[0];
    for (let i = 0; i < 60; i++) {
        const conf = document.createElement('div');
        conf.className = 'rg-confetti';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        conf.style.animationDelay = (Math.random() * 0.5) + 's';
        cardEl.appendChild(conf);
    }
    // Чистим конфетти после анимации
    setTimeout(() => {
        cardEl.querySelectorAll('.rg-confetti').forEach(c => c.remove());
    }, 4500);

    const close = () => {
        overlay.css({ opacity: 0, transition: 'opacity .25s' });
        setTimeout(() => {
            overlay.remove();
            if (onConfirm) onConfirm(graduates);
        }, 280);
    };

    card.find('.rg-confirm').on('click', close);
    overlay.on('click', (e) => { if (e.target === overlay[0]) close(); });
    overlay.on('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') close(); });
}
