// Joinked from https://github.com/bradyjoslin/webcrypto-example/blob/master/script.js

const buff_to_base64 = (buff) => btoa(String.fromCharCode.apply(null, buff));

const base64_to_buf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));

const enc = new TextEncoder();
const dec = new TextDecoder();

async function encrypt(data, password) {
    const encrypted_data = await encrypt_data(data, password);
    return encrypted_data;
}

async function decrypt(data, password) {
    const decrypted_data = await decryptData(data, password);
    callback(decrypted_data);
}

const get_password_key = (password) =>
    window.crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
        "deriveKey",
]);

const derive_key = (password_key, salt, key_usage) => {
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 250000,
            hash: "SHA-256",
        },
        password_key,
        { name: "AES-GCM", length: 256 },
        false,
        key_usage
    );
}

async function encrypt_data(secret_data, password) {
    try {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const password_key = await get_password_key(password);
        const aes_key = await derive_key(password_key, salt, ["encrypt"]);
        const encrypted_content = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            aes_key,
            enc.encode(secret_data)
        );

        const encrypted_content_arr = new Uint8Array(encrypted_content);
        let buff = new Uint8Array(
            salt.byteLength + iv.byteLength + encrypted_content_arr.byteLength
        );
        buff.set(salt, 0);
        buff.set(iv, salt.byteLength);
        buff.set(encrypted_content_arr, salt.byteLength + iv.byteLength);
        const base64_buff = buff_to_base64(buff);
        return base64_buff;
    } catch (e) {
        console.log(`Error - ${e}`);
        return "";
    }
}

async function decrypt_data(encrypted_data, password) {
    try {
        const encrypted_data_buff = base64_to_buf(encrypted_data);
        const salt = encrypted_data_buff.slice(0, 16);
        const iv = encrypted_data_buff.slice(16, 16 + 12);
        const data = encrypted_data_buff.slice(16 + 12);
        const password_key = await get_password_key(password);
        const aes_key = await derive_key(password_key, salt, ["decrypt"]);
        const decrypted_content = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
            aes_key,
            data
        );
        return dec.decode(decrypted_content);
    } catch (e) {
        console.log(`Error - ${e}`);
        return "";
    }
}