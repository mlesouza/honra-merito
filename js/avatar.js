// ============================================================
// avatar.js — Upload, resize e exibição de fotos de perfil
// Fotos são redimensionadas para 80x80 e salvas como base64
// no campo avatarDataUrl dentro de db.json → users[]
// ============================================================

const AvatarUtils = (() => {
  const MAX_SIZE = 80; // px — tamanho final da foto

  // Redimensiona e recorta a imagem para um quadrado centralizado
  const resize = (file) => new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("O arquivo selecionado não é uma imagem."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("A imagem deve ter no máximo 5MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Erro ao carregar a imagem."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext("2d");

        // Recorte centralizado (crop quadrado)
        const cropSize = Math.min(img.width, img.height);
        const sx = (img.width - cropSize) / 2;
        const sy = (img.height - cropSize) / 2;

        // Fundo escuro para imagens com transparência
        ctx.fillStyle = "#161b22";
        ctx.fillRect(0, 0, MAX_SIZE, MAX_SIZE);

        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, MAX_SIZE, MAX_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Salva o avatarDataUrl no db.json para o memberId informado
  const save = async (memberId, dataUrl) => {
    await GitHubAPI.updateDB((data) => {
      if (!data.users) data.users = [];
      const userRecord = data.users.find((u) => u.memberId === memberId);
      if (userRecord) {
        userRecord.avatarDataUrl = dataUrl;
      } else {
        // Cria registro sem hash de senha (será preenchido no registro)
        data.users.push({ memberId, avatarDataUrl: dataUrl });
      }
      return data;
    }, `chore: atualiza foto de perfil de ${memberId}`);
  };

  // Retorna o HTML de exibição do avatar (foto ou emoji fallback)
  // users: array de db.json.users
  // fallbackEmoji: emoji de CONFIG.MEMBERS
  // size: tamanho em px
  const getDisplay = (memberId, users = [], fallbackEmoji = "🧑‍💻", size = 40) => {
    const userRecord = users.find((u) => u.memberId === memberId);

    if (userRecord?.avatarDataUrl) {
      return `<img
        src="${userRecord.avatarDataUrl}"
        alt="Foto de perfil"
        class="avatar-photo"
        style="width:${size}px;height:${size}px;"
      />`;
    }

    return `<span class="avatar-emoji" style="font-size:${size * 0.65}px" aria-hidden="true">${fallbackEmoji}</span>`;
  };

  return { resize, save, getDisplay };
})();
