function button(label, action, extraClass = '', title = '') {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = `gea-button ${extraClass}`.trim();
    element.dataset.action = action;
    element.textContent = label;
    if (title) element.title = title;
    return element;
}

function range(label, key, min, max, value, unit = '') {
    const element = document.createElement('label');
    element.className = 'gea-range';

    const name = document.createElement('span');
    name.className = 'gea-range-label';
    name.textContent = label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.dataset.adjustment = key;

    const output = document.createElement('output');
    output.dataset.output = key;
    output.textContent = `${value}${unit}`;
    element.append(name, input, output);
    return element;
}

export function createModal() {
    const overlay = document.createElement('div');
    // Current Ghost Admin uses these Pintura-era selectors to recognize close intent.
    overlay.className = 'PinturaModal ghost-editor-adapter';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image editor');
    overlay.tabIndex = -1;

    const header = document.createElement('header');
    header.className = 'gea-header';
    const title = document.createElement('div');
    title.className = 'gea-title';
    title.textContent = 'Quick edit';
    const actions = document.createElement('div');
    actions.className = 'gea-header-actions';
    actions.append(
        button('Cancel', 'cancel', '', 'Close'),
        button('Reset', 'reset'),
        button('Save and close', 'save', 'gea-button-primary', 'Save and close'),
    );
    header.append(title, actions);

    const workspace = document.createElement('main');
    workspace.className = 'gea-workspace';
    const stage = document.createElement('div');
    stage.className = 'gea-stage';
    const controls = document.createElement('aside');
    controls.className = 'gea-controls';
    controls.setAttribute('aria-label', 'Image controls');

    const transform = document.createElement('section');
    transform.className = 'gea-group';
    transform.innerHTML = '<h3>Transform</h3>';
    const transformButtons = document.createElement('div');
    transformButtons.className = 'gea-button-row';
    transformButtons.append(
        button('↶ 90°', 'rotate-left'),
        button('↷ 90°', 'rotate-right'),
        button('↔ Flip', 'flip-x'),
        button('↕ Flip', 'flip-y'),
        button('−', 'zoom-out', '', 'Zoom out'),
        button('+', 'zoom-in', '', 'Zoom in'),
    );
    transform.append(transformButtons, range('Straighten', 'rotation', -15, 15, 0, '°'));

    const crop = document.createElement('section');
    crop.className = 'gea-group';
    crop.innerHTML = '<h3>Crop</h3>';
    const ratios = document.createElement('div');
    ratios.className = 'gea-ratios';
    [['Free', 'free'], ['Original', 'original'], ['1:1', '1'], ['3:2', '1.5'], ['4:3', String(4 / 3)], ['16:10', '1.6'], ['16:9', String(16 / 9)]].forEach(([label, value]) => {
        const item = button(label, 'ratio');
        item.dataset.ratio = value;
        if (value === 'free') item.classList.add('is-active');
        ratios.appendChild(item);
    });
    crop.appendChild(ratios);

    const photo = document.createElement('section');
    photo.className = 'gea-group';
    photo.innerHTML = '<h3>Photo</h3>';
    photo.append(
        range('Brightness', 'brightness', 50, 150, 100, '%'),
        range('Contrast', 'contrast', 50, 150, 100, '%'),
        range('Saturation', 'saturation', 0, 200, 100, '%'),
        range('Temperature', 'temperature', -100, 100, 0),
    );

    controls.append(transform, crop, photo);
    workspace.append(stage, controls);
    overlay.append(header, workspace);
    document.body.appendChild(overlay);
    return {overlay, stage};
}

export function updateRangeOutput(overlay, key, value) {
    const output = overlay.querySelector(`[data-output="${key}"]`);
    if (!output) return;
    const suffix = key === 'rotation' ? '°' : ['brightness', 'contrast', 'saturation'].includes(key) ? '%' : '';
    output.textContent = `${value}${suffix}`;
}
