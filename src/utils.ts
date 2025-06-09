export function escapeXml(text: string, options?: { control?: boolean }) {
	const re = options?.control ? /[&<>"\p{C}]/gu : /[&<>"]/g;
	return text.replace(re, (m) => {
		switch (m) {
			case "&":
				return "&amp;";
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case '"':
				return "&quot;";
		}
		return `&#x${m.charCodeAt(0).toString(16)};`;
	});
}

export function unescapeXml(text: string) {
	return text.replace(/&(amp|lt|gt|quot|#x[0-9A-Fa-f]+|#[0-9]+);/g, (m) => {
		switch (m) {
			case "&amp;":
				return "&";
			case "&lt;":
				return "<";
			case "&gt;":
				return ">";
			case "&quot;":
				return '"';
		}
		const code = m.startsWith("&#x")
			? Number.parseInt(m.substring(2), 16)
			: Number.parseInt(m.substring(1), 10);
		return String.fromCharCode(code);
	});
}

export class CacheMap<K, V> extends Map<K, V> {
	private capacity;

	constructor(capacity: number) {
		super();
		this.capacity = capacity;
	}

	set(key: K, value: V) {
		super.set(key, value);
		if (this.size > this.capacity) {
			for (const key of this.keys()) {
				this.delete(key);
			}
		}
		return this;
	}

	get(key: K) {
		if (!super.has(key)) {
			return;
		}

		const value = super.get(key);
		this.delete(key);
		if (value !== undefined) {
			super.set(key, value);
		}
		return value;
	}
}
