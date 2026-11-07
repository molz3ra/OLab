import net from "node:net";

export interface UrlSafetyCheck {
  safe: boolean;
  reason?: string;
  url?: URL;
}

/**
 * Lista de domínios ou padrões de host estritamente proibidos (Loopback, Cloud Metadata, etc.)
 */
const FORBIDDEN_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "metadata.google.internal",
  "instance-data",
]);

/**
 * Valida se um endereço IPv4 pertence a faixas privadas, loopback ou reservadas (RFC 1918, RFC 3927, etc.)
 */
function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Inválido -> tratar como inseguro
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Rede Privada)
  if (a === 10) return true;

  // 172.16.0.0/12 (Rede Privada: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Rede Privada)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local e AWS/GCP/Azure instance metadata)
  if (a === 169 && b === 254) return true;

  // 0.0.0.0/8 (Rede atual)
  if (a === 0) return true;

  // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Documentação e testes)
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast) e 240.0.0.0/4 (Reservado)
  if (a >= 224) return true;

  return false;
}

/**
 * Valida se um endereço IPv6 pertence a faixas privadas, loopback ou link-local
 */
function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1)
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // Unspecified (::)
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // Unique Local Address fc00::/7 (fc00:: a fdff::)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-local Unicast fe80::/10
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:192.0.2.1)
  if (normalized.includes("::ffff:")) {
    const v4Part = normalized.split("::ffff:")[1];
    if (v4Part && net.isIPv4(v4Part)) {
      return isPrivateOrReservedIPv4(v4Part);
    }
  }

  return false;
}

/**
 * Portas permitidas para raspagem pública de sites
 */
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

/**
 * Validação rigorosa contra SSRF (Server-Side Request Forgery).
 * Garante que apenas URLs públicas, sob HTTP/HTTPS e portas padrão de web possam ser acessadas.
 */
export function isSafePublicUrl(urlInput: string): UrlSafetyCheck {
  let parsed: URL;

  try {
    parsed = new URL(urlInput);
  } catch {
    return { safe: false, reason: "URL fornecida possui formato inválido." };
  }

  // 1. Somente protocolos http e https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      safe: false,
      reason: `Protocolo '${parsed.protocol}' proibido. Apenas 'http:' e 'https:' são aceitos.`,
    };
  }

  // 2. Não permitir credenciais embutidas na URL (ex: https://user:pass@host)
  if (parsed.username || parsed.password) {
    return {
      safe: false,
      reason: "URLs contendo credenciais de autenticação embutidas não são permitidas.",
    };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  // 3. Proibir nomes de hosts proibidos e domínios de loopback/internos
  if (
    FORBIDDEN_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".arpa")
  ) {
    return {
      safe: false,
      reason: "O acesso a endereços locais ou internos da rede é estritamente bloqueado por segurança.",
    };
  }

  // 4. Proibir representações de IP numérico decimal inteiro (ex: http://2130706433)
  if (/^\d+$/.test(hostname)) {
    return {
      safe: false,
      reason: "Formatos de endereço IP em valor inteiro não são permitidos.",
    };
  }

  // 5. Verificação de endereço IP direto
  const ipVersion = net.isIP(hostname);
  if (ipVersion === 4) {
    if (isPrivateOrReservedIPv4(hostname)) {
      return {
        safe: false,
        reason: "O IP informado pertence a uma faixa privada, reservada ou de loopback.",
      };
    }
  } else if (ipVersion === 6) {
    if (isPrivateOrReservedIPv6(hostname)) {
      return {
        safe: false,
        reason: "O IP informado pertence a uma faixa IPv6 privada, reservada ou de loopback.",
      };
    }
  }

  // 6. Restrição de porta
  if (!ALLOWED_PORTS.has(parsed.port)) {
    return {
      safe: false,
      reason: `A porta ${parsed.port} não é permitida para requisições externas de análise.`,
    };
  }

  return { safe: true, url: parsed };
}

