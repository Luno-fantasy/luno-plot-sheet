const fields = {
  titleInput: ['previewTitle', '作品タイトル'],
  catchInput: ['previewCatch', 'ここにキャッチコピーが入ります。'],
  relationshipInput: ['previewRelationship', '関係性を入力してください'],
  categoryInput: ['previewCategory', 'Fantasy'],
  creatorInput: ['previewCreator', 'Luno'],
  tagInput: ['previewTags', '#幻想 #創作 #AIチャット'],
  summaryInput: ['previewSummary', 'ここにあらすじやキャラクター紹介が表示されます。作品の関係性や惹きになる要素を、短く読みやすくまとめる想定です。']
};

const STORAGE_KEY = 'lunoPlotSheetWorksV1';
const statusText = document.getElementById('statusText');
const coverInput = document.getElementById('coverInput');
const previewCover = document.getElementById('previewCover');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const summaryInput = document.getElementById('summaryInput');
const charCount = document.getElementById('charCount');
const typeInputs = [...document.querySelectorAll('input[name="type"]')];
const platformInputs = [...document.querySelectorAll('input[name="platform"]')];
const previewType = document.getElementById('previewType');
const previewPlatform = document.getElementById('previewPlatform');
const savedWorksSelect = document.getElementById('savedWorksSelect');
let currentCoverData = '';

Object.entries(fields).forEach(([inputId, [previewId, fallback]]) => {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  input.addEventListener('input', () => {
    preview.textContent = input.value.trim() || fallback;
    if (inputId === 'summaryInput') {
      charCount.textContent = input.value.length;
      fitSummaryText();
    }
  });
});

function selectedValues(inputs) {
  return inputs.filter(input => input.checked).map(input => input.value);
}

function updateTypePreview() {
  const selected = selectedValues(typeInputs);
  previewType.textContent = selected.length ? selected.join(' / ') : '未選択';
}

function updatePlatformPreview() {
  const selected = selectedValues(platformInputs);
  previewPlatform.textContent = selected.length ? selected.join(' / ') : '未選択';
}

typeInputs.forEach(input => input.addEventListener('change', updateTypePreview));
platformInputs.forEach(input => input.addEventListener('change', updatePlatformPreview));

function resizeImageForStorage(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const maxW = 600;
      const maxH = 800;
      const ratio = Math.min(1, maxW / img.width, maxH / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

coverInput.addEventListener('change', () => {
  const file = coverInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async event => {
    currentCoverData = await resizeImageForStorage(event.target.result);
    previewCover.src = currentCoverData;
    previewCover.hidden = false;
    coverPlaceholder.hidden = true;
  };
  reader.readAsDataURL(file);
});

function fitSummaryText() {
  const text = summaryInput.value;
  const preview = document.getElementById('previewSummary');
  let size = 14;
  if (text.length > 650) size = 11.5;
  else if (text.length > 450) size = 12.5;
  else if (text.length > 280) size = 13;
  preview.style.fontSize = `${size}px`;
}

function getWorks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setWorks(works) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
}

function refreshSavedWorks(selectedKey = '') {
  const works = getWorks();
  savedWorksSelect.innerHTML = '<option value="">保存した作品を選択</option>';
  Object.keys(works).sort((a, b) => a.localeCompare(b, 'ja')).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = works[key].title || key;
    savedWorksSelect.appendChild(option);
  });
  if (selectedKey && works[selectedKey]) savedWorksSelect.value = selectedKey;
}

function collectWorkData() {
  return {
    title: document.getElementById('titleInput').value.trim(),
    catchcopy: document.getElementById('catchInput').value,
    relationship: document.getElementById('relationshipInput').value,
    category: document.getElementById('categoryInput').value,
    types: selectedValues(typeInputs),
    tags: document.getElementById('tagInput').value,
    creator: document.getElementById('creatorInput').value,
    platforms: selectedValues(platformInputs),
    workId: document.getElementById('idInput').value,
    url: document.getElementById('urlInput').value,
    summary: document.getElementById('summaryInput').value,
    coverData: currentCoverData
  };
}

function applyWorkData(data) {
  const mapping = {
    titleInput: data.title || '',
    catchInput: data.catchcopy || '',
    relationshipInput: data.relationship || '',
    categoryInput: data.category || '',
    tagInput: data.tags || '',
    creatorInput: data.creator || '',
    idInput: data.workId || '',
    urlInput: data.url || '',
    summaryInput: data.summary || ''
  };
  Object.entries(mapping).forEach(([id, value]) => {
    const input = document.getElementById(id);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  });
  typeInputs.forEach(input => { input.checked = (data.types || []).includes(input.value); });
  platformInputs.forEach(input => { input.checked = (data.platforms || []).includes(input.value); });
  updateTypePreview();
  updatePlatformPreview();
  currentCoverData = data.coverData || '';
  if (currentCoverData) {
    previewCover.src = currentCoverData;
    previewCover.hidden = false;
    coverPlaceholder.hidden = true;
  } else {
    previewCover.src = '';
    previewCover.hidden = true;
    coverPlaceholder.hidden = false;
  }
  coverInput.value = '';
  fitSummaryText();
}

document.getElementById('saveWorkButton').addEventListener('click', () => {
  const data = collectWorkData();
  if (!data.title) {
    statusText.textContent = '保存する前にタイトルを入力してください。';
    return;
  }
  const works = getWorks();
  const key = data.title;
  works[key] = data;
  try {
    setWorks(works);
    refreshSavedWorks(key);
    statusText.textContent = `「${data.title}」をこの端末に保存しました。`;
  } catch (error) {
    console.error(error);
    statusText.textContent = '保存容量を超えました。カバー画像を外してもう一度お試しください。';
  }
});

document.getElementById('loadWorkButton').addEventListener('click', () => {
  const key = savedWorksSelect.value;
  if (!key) {
    statusText.textContent = '呼び出す作品を選んでください。';
    return;
  }
  const work = getWorks()[key];
  if (!work) return;
  applyWorkData(work);
  statusText.textContent = `「${work.title || key}」を呼び出しました。`;
});

document.getElementById('deleteWorkButton').addEventListener('click', () => {
  const key = savedWorksSelect.value;
  if (!key) {
    statusText.textContent = '削除する作品を選んでください。';
    return;
  }
  const works = getWorks();
  const title = works[key]?.title || key;
  delete works[key];
  setWorks(works);
  refreshSavedWorks();
  statusText.textContent = `「${title}」を保存一覧から削除しました。`;
});

document.getElementById('sampleButton').addEventListener('click', () => {
  applyWorkData({
    title: 'ボス、今夜は俺に従え。',
    catchcopy: '忠実な右腕が、二人きりの夜だけ命令を変える。',
    relationship: '右腕 × ファミリアのボス',
    category: 'Mafia / Romance',
    types: ['NL'],
    tags: '#主従 #執着 #マフィア #大人の恋愛',
    creator: 'Luno',
    platforms: ['ZETA', 'Talelynx'],
    workId: '',
    url: '',
    summary: '名門ファミリアのボスと、その右腕を務めるアンダーボス。\n公の場では完璧な忠誠を見せる男は、二人きりになると食事も睡眠も静かに管理してくる。\n\n「従わせたいんじゃない。お前が自分から俺を選ぶまで待っている」',
    coverData: ''
  });
  statusText.textContent = 'サンプルを反映しました。';
});

document.getElementById('resetButton').addEventListener('click', () => {
  Object.entries(fields).forEach(([inputId, [previewId, fallback]]) => {
    const input = document.getElementById(inputId);
    input.value = '';
    document.getElementById(previewId).textContent = fallback;
  });
  document.getElementById('idInput').value = '';
  document.getElementById('urlInput').value = '';
  typeInputs.forEach(input => { input.checked = false; });
  platformInputs.forEach(input => { input.checked = false; });
  updateTypePreview();
  updatePlatformPreview();
  coverInput.value = '';
  currentCoverData = '';
  previewCover.src = '';
  previewCover.hidden = true;
  coverPlaceholder.hidden = false;
  charCount.textContent = '0';
  fitSummaryText();
  statusText.textContent = '入力内容をリセットしました。';
});

document.getElementById('downloadButton').addEventListener('click', async () => {
  const sheet = document.getElementById('plotSheet');
  const button = document.getElementById('downloadButton');
  button.disabled = true;
  button.textContent = '書き出し中…';
  statusText.textContent = 'PNGを生成しています。';
  try {
    const canvas = await html2canvas(sheet, {
      scale: 1200 / sheet.offsetWidth,
      useCORS: true,
      backgroundColor: '#fcfbff',
      logging: false
    });
    const link = document.createElement('a');
    const rawTitle = document.getElementById('titleInput').value.trim() || 'luno-plot-sheet';
    const safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, '_');
    link.download = `${safeTitle}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    statusText.textContent = 'PNGを書き出しました。';
  } catch (error) {
    console.error(error);
    statusText.textContent = '書き出しに失敗しました。もう一度お試しください。';
  } finally {
    button.disabled = false;
    button.textContent = 'PNGを書き出す';
  }
});

function fitPreview() {
  const wrap = document.querySelector('.sheet-wrap');
  const sheet = document.getElementById('plotSheet');
  if (window.innerWidth > 760) {
    sheet.style.transform = '';
    sheet.style.marginBottom = '';
    return;
  }
  const available = Math.max(260, wrap.clientWidth - 4);
  const scale = Math.min(1, available / 720);
  sheet.style.transform = `scale(${scale})`;
  sheet.style.marginBottom = `${-(sheet.offsetHeight * (1 - scale))}px`;
}

window.addEventListener('resize', fitPreview);
window.addEventListener('load', fitPreview);
summaryInput.dispatchEvent(new Event('input'));
updateTypePreview();
updatePlatformPreview();
refreshSavedWorks();
