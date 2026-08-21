const fields = {
  titleInput: ['previewTitle', '作品タイトル'],
  catchInput: ['previewCatch', 'ここにキャッチコピーが入ります。'],
  categoryInput: ['previewCategory', 'Fantasy'],
  creatorInput: ['previewCreator', 'Luno'],
  idInput: ['previewId', 'ZETA / Talelynx'],
  tagInput: ['previewTags', '#幻想 #創作 #AIチャット'],
  summaryInput: ['previewSummary', 'ここにあらすじやキャラクター紹介が表示されます。作品の関係性や惹きになる要素を、短く読みやすくまとめる想定です。']
};

const statusText = document.getElementById('statusText');
const coverInput = document.getElementById('coverInput');
const previewCover = document.getElementById('previewCover');
const coverPlaceholder = document.getElementById('coverPlaceholder');
const summaryInput = document.getElementById('summaryInput');
const charCount = document.getElementById('charCount');
const typeInputs = [...document.querySelectorAll('input[name="type"]')];
const previewType = document.getElementById('previewType');

Object.entries(fields).forEach(([inputId, [previewId, fallback]]) => {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  input.addEventListener('input', () => {
    preview.textContent = input.value.trim() || fallback;
    if (inputId === 'summaryInput') charCount.textContent = input.value.length;
  });
});

function updateTypePreview() {
  const selected = typeInputs.filter(input => input.checked).map(input => input.value);
  previewType.textContent = selected.length ? selected.join(' / ') : '未選択';
}

typeInputs.forEach(input => input.addEventListener('change', updateTypePreview));

coverInput.addEventListener('change', () => {
  const file = coverInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    previewCover.src = event.target.result;
    previewCover.hidden = false;
    coverPlaceholder.hidden = true;
  };
  reader.readAsDataURL(file);
});

document.getElementById('sampleButton').addEventListener('click', () => {
  const sample = {
    titleInput: 'ボス、今夜は俺に従え。',
    catchInput: '忠実な右腕が、二人きりの夜だけ命令を変える。',
    categoryInput: 'Mafia / Romance',
    creatorInput: 'Luno',
    idInput: 'ZETA / Talelynx',
    tagInput: '#主従 #執着 #マフィア #大人の恋愛',
    summaryInput: '名門ファミリアのボスと、その右腕を務めるアンダーボス。\n公の場では完璧な忠誠を見せる男は、二人きりになると食事も睡眠も静かに管理してくる。\n\n「従わせたいんじゃない。お前が自分から俺を選ぶまで待っている」'
  };

  Object.entries(sample).forEach(([id, value]) => {
    const input = document.getElementById(id);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  });

  typeInputs.forEach(input => { input.checked = input.value === 'NL'; });
  updateTypePreview();
  statusText.textContent = 'サンプルを反映しました。';
});

document.getElementById('resetButton').addEventListener('click', () => {
  Object.entries(fields).forEach(([inputId, [previewId, fallback]]) => {
    const input = document.getElementById(inputId);
    input.value = '';
    document.getElementById(previewId).textContent = fallback;
  });
  typeInputs.forEach(input => { input.checked = false; });
  updateTypePreview();
  coverInput.value = '';
  previewCover.src = '';
  previewCover.hidden = true;
  coverPlaceholder.hidden = false;
  charCount.textContent = '0';
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
