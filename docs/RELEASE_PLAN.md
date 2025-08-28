# リリース計画（iOS先行）

目的: 9/7に一般ユーザーが使える品質でiOS先行リリース（TestFlight配布→申請）

## スケジュール（目安）
- Day 1-2: 導線完成（購入検討リスト/画像アップロード/認証UX）+ Dev Client/EAS準備
- Day 3-4: 課金/通知の下準備（キー待ちの部分をモック/ゲート）+ 計測（Sentry/Mixpanel）
- Day 5: QA・文言・エラーUX・権限周りの磨き
- Day 6: TestFlight配布、フィードバック反映
- Day 7: 申請素材最終化 → 提出

## 必要な本番キー（現状: 指示者から提供待ち）
- RevenueCat: iOS API Key / Offering / ProductID
- OneSignal: App ID（iOS）
- Sentry DSN / Mixpanel Token（任意だが推奨）

## 成果物
- TestFlight配布ビルド
- ストア素材（アイコン/スクショ/説明文/キーワード/年齢区分/プライポリURL）
- リリースノート（簡潔）

## クリティカルチェック
- 認証: サインアップ/ログイン/リセット、メール確認導線
- 画像: リサイズ/署名URL/失敗時の再試行
- 購入検討リスト: 追加/削除/購入済み反映/外部リンク遷移
- 課金: ゲートが安全（キー待ち中はタップで案内・後日有効）
- 通知: 最小（権限要求/開封ハンドラ）。高度な施策は後日
- 安定性: Sentry・最低限のMixpanelイベント
- 配信: EAS Dev Clientで動作→TestFlightビルド成功

