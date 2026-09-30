import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { img, Status } from '../api';
import { C, space } from '../theme';
import { Button } from './Button';

export type VStatus = Status & { label: string };

// Chat tag for a status: quotes the story so the business can identify
// exactly what the customer is asking about.
export function statusLabel(s: Status, businessName: string) {
  const snip = (t: string) => (t.length > 42 ? t.slice(0, 42) + '…' : t);
  if (s.kind === 'text' && s.text) return `About update: "${snip(s.text)}"`;
  if (s.caption) return `About photo: "${snip(s.caption)}"`;
  return `About ${businessName} photo update`;
}
// Portrait story viewer: progress segments, tap edges, caption overlay,
// Message button tags the conversation. 5s per story, loops closed at end.
export function StatusViewer({
  items, businessName, businessId, start = 0, onClose, onMessage, messaging = true,
}: {
  items: VStatus[]; businessName: string; businessId: string;
  start?: number; onClose: () => void;
  onMessage: (businessId: string, label: string) => void; messaging?: boolean;
}) {
  const [i, setI] = useState(start);
  const [fill, setFill] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFill(0);
    const t0 = Date.now();
    timer.current = setInterval(() => {
      const p = (Date.now() - t0) / 5000;
      if (p >= 1) { nav(1); } else setFill(p);
    }, 100);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [i, items.length]);
  if (items.length === 0) return null;

  const nav = (d: number) => {
    const n = i + d;
    if (n >= items.length || n < 0) { onClose(); return; }
    setI(n);
  };
  const s = items[i];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.prog}>
          {items.map((_, j) => (
            <View key={j} style={styles.seg}>
              <View style={[styles.fill, { flex: j < i ? 1 : 0, opacity: j === i ? fill : 1 }]} />
            </View>
          ))}
        </View>
        <View style={styles.head}>
          <Text style={styles.biz}>{businessName}</Text>
          <Pressable onPress={onClose}><Text style={styles.x}>✕</Text></Pressable>
        </View>
        {s.kind === 'text' ? (
          <View style={[styles.textSlide, { backgroundColor: s.bg ?? C.primary }]}>
            <Text style={styles.textBody}>{s.text}</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {s.imageKey && <Image source={{ uri: img(s.imageKey) }} style={styles.photo} />}
            {!!s.caption && (
              <View style={styles.cap}><Text style={styles.capT}>{s.caption}</Text></View>
            )}
          </View>
        )}
        <View style={styles.taps}>
          <Pressable style={{ flex: 1 }} onPress={() => nav(-1)} />
          <Pressable style={{ flex: 1 }} onPress={() => nav(1)} />
        </View>
        <View style={styles.msg}>
          {messaging && <Button title="Message" onPress={() => { onClose(); onMessage(businessId, s.label); }} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  prog: { flexDirection: 'row', gap: 4, paddingTop: 48, paddingHorizontal: 12, paddingBottom: 8 },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.35)', overflow: 'hidden', flexDirection: 'row' },
  fill: { backgroundColor: '#fff' },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  biz: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  x: { color: '#fff', fontSize: 20, padding: 4 },
  photo: { flex: 1, width: '100%' },
  textSlide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  textBody: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  cap: {
    position: 'absolute', left: 16, right: 16, bottom: 8,
    backgroundColor: 'rgba(0,0,0,.45)', borderRadius: 8, padding: 10,
  },
  capT: { color: '#fff', fontSize: 14 },
  taps: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  msg: { padding: 12, paddingBottom: 28 },
});
