import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '../config/constants';

const { height: screenHeight } = Dimensions.get('window');

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
  plantName: string;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ visible, onClose, plantName }) => {
  const sampleMessages = [
    {
      id: '1',
      type: 'user',
      text: '葉が黄色くなってきた',
    },
    {
      id: '2',
      type: 'ai',
      text: '土の表面から3–4cmが乾いているか確認してみて。乾いていたら給水、湿っていれば数日控えるのが◎。置き場所は明るい日陰がベター。',
    },
  ];

  const quickTips = [
    '水やり頻度を知りたい',
    '置き場所はどこがいい？',
    '冬の管理のコツ',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI相談 - {plantName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textOnBase} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.messagesContainer}>
            {sampleMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.type === 'user' ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === 'user' && styles.userMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.quickTipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickTips.map((tip, index) => (
                <TouchableOpacity key={index} style={styles.quickTip}>
                  <Text style={styles.quickTipText}>{tip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="質問を入力..."
              placeholderTextColor={COLORS.textSecondary}
              editable={false}
            />
            <TouchableOpacity style={styles.sendButton} disabled>
              <Ionicons name="send" size={20} color={COLORS.textOnPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.base,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    height: screenHeight * 0.8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.textOnBase,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  messagesContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.textOnPrimary,
  },
  quickTipsContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickTip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickTipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textOnBase,
    marginRight: SPACING.sm,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
});

export default AIChatModal;