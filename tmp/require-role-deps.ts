import type { Message } from "@/types/chat";
import { motion } from "framer-motion";
import {
  Sparkles,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Labels } from "@/components/ui/labels";
import { buildChatCompletion } from "@lib/chat";
import {
  Pencil,
} from "lucide-react";
import { badge, ChatBubbleAvatar } from "@/components/ui/chat-bubble"; import type { Reaction } from "@/types/reactions";
import { ReactionPicker } from "@/components/ui/reaction-picker";
import { SubThread } from "@/components/ui/subthread"; import type { Attachment } from "@/types/attachment";
import { AttachmentCard } from "@/components/ui/attachment-card";
import { AttachmentPreview } from "@/components/ui/attachment-preview";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { SpoilerButton } from "@/components/ui/spoiler-button";
import { ChatInput } from "@/components/ui/chat-input"; import type { User } from "@/types/user";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { handleCreateChannel, validateChannelName } from "@/lib/channel";
import {
  ChatWindowWrapper,
  ChatWindowContent,
  ChatWindowHeader,
  ChatWindowSidebar,
  ChatWindowMain,
} from "@/components/ui/chat-window";
import { generateDocumentLink, isDocument } from "@/lib/document"; import type { Document } from "/types/document";
import { DocumentContextMenu } from "@/components/ui/document-context-menu";
import {
  DiffView,
  DiffViewLine,
  DiffViewHeader,
  DiffViewLineInsert,
  DiffViewLineDelete,
  DiffViewLineEqual,
  DiffViewEmpty,
  DiffViewLineOldFile,
  DiffViewLineNewFile,
} from "@/components/ui/diff";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  profanityFilter,
  isProfanitySafe,
} from "@/lib/profanity";
import { PaperclipIcon } from "lucide-react"; import type { Thread } from "@/types/thread";
import {
  DocumentViewerEscalationPolicy,
  DocumentViewerGuardrailPolicy,
  DocumentViewerTaskPolicy,
} from "@/components/ui/document-viewer";
import {
  CreateDocumentModal,
  CreateDocumentModalContent,
  CreateDocumentModalFooter,
  CreateDocumentModalHeader,
  CreateDocumentModalTitle,
} from "@/components/ui/create-document-modal";
import {
  DocumentViewerWrapper,
  DocumentViewerBody,
  DocumentViewerHeader,
} from "@/components/ui/document-viewer";
import {
  ReviewDocumentModal,
  ReviewDocumentModalContent,
  ReviewDocumentModalFooter,
  ReviewDocumentModalHeader,
  ReviewDocumentModalTitle,
} from "@/components/ui/review-document-modal";
import {
  ConfirmDocumentDeleteModal,
  ConfirmDocumentDeleteModalContent,
  ConfirmDocumentDeleteModalFooter,
  ConfirmDocumentDeleteModalHeader,
  ConfirmDocumentDeleteModalTitle,
} from "@/components/ui/confirm-document-delete-modal";
import type { ChannelType } from "@/types/channel";
import { ChatListEmpty } from "@/components/ui/chat-list-empty";
import {
  FormattingToolbar,
  FormattingToolbarItem,
  FormattingToolbarContent,
  FormattingToolbarButton,
} from "@/components/ui/formatting-toolbar";
import {
  WindowCountBadge,
  WindowCountBadgeProps,
  WindowCountBadgeContent,
} from "@/components/ui/window-count-badge";
import {
  useLinkPreview,
  useWindowCountBadge,
  useChatContext,
  useConnectionStatus,
  useWorkspace,
  useChannelUnreadBadge,
  useCurrentUser,
  usePrompts,
  useFormattingToolbar,
  useRecentChannels,
  useDocumentObserver,
  useMarkConversationUnread,
  useReaction,
  useSubthread,
  useUser,
} from "@/hooks";
import {
  ArrowUpRight,
  X,
  Server,
} from "lucide-react";
import {
  ChannelHeaderBadge,
  ChannelHeaderIcon,
  ChannelHeaderSubtitle,
  ChannelHeaderTitle,
  ChannelHeaderUserCount,
} from "@/components/ui/channel-header";
import {
  MembersListModal,
  MembersListModalContent,
  MembersListModalFooter,
  MembersListModalHeader,
  MembersListModalTitle,
} from "@/components/ui/members-list-modal";
import {
  UserPreviewAvatar,
  UserPreviewDetails,
  UserPreviewName,
  UserPreviewPresence,
  UserPreviewStatus,
} from "@/components/ui/user-preview";
import { Logo } from "@/components/Logo";
import { LogoDropdown } from "@/components/LogoDropdown";
import type { Club } from "@/types/club";
import {
  ClubAvatar,
  ClubAvatarFallback,
  ClubAvatarImage,
} from "@/components/ui/club-avatar";
import type { Server } from "@/types/server";
import {
  EmailButton,
  NameInput,
  PasswordInput,
  SignUpForm,
} from "@/components/ui/auth-form";
import { SpoilerHover } from "@/components/ui/spoiler-hover";
import { QRCode } from "@/components/QrCode";
import {
  AttachmentCardGrouping,
  AttachmentCardGroupingItem,
} from "@/components/ui/attachment-card-grouping";
import { QrScannerPanel } from "@/components/QrScannerPanel";
import {
  DynamicFormFields,
  type FieldValues,
} from "@/components/DynamicFormFields";
import { QrScannerToggle } from "@/components/QrScannerToggle";
import { QrCode as QrCodeIcon } from "lucide-react";
import { QrTicket } from "@/components/QrTicket";
import { useAuth } from "@/hooks/use-auth";
import {
  ExternalLink,
  Hash,
  Info,
  Mail,
  QrCode,
  Search,
  UserSquares,
  LinkIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MailButton } from "@/components/ui/mail-button";
import {
  CategoryDialog,
  CategoryDialogContent,
  CategoryDialogDescription,
  CategoryDialogFooter,
  CategoryDialogHeader,
  CategoryDialogTitle,
} from "@/components/ui/category-dialog";
import {
  CategoryButton,
  CategoryDialog,
  CategoryDialogContent,
  CategoryDialogDescription,
  CategoryDialogFooter,
  CategoryDialogHeader,
  CategoryDialogTitle,
} from "@/components/ui/category-dialog"; import type { FactionResources } from "@/types/resources";
import {
  ResourcePickerContextProvider,
  useResourcePicker,
} from "@/hooks/use-resource-picker";
import {
  ResourcePicker,
  ResourcePickerContent,
  ResourcePickerFooter,
  ResourcePickerHeader,
  ResourcePickerTitle,
} from "@/components/ui/resource-picker";
import {
  CategorySelector,
  CategorySelectorContent,
  CategorySelectorControl,
  CategorySelectorOption,
  CategorySelectorPlaceholder,
} from "@/components/ui/category-selector";
import {
  CategoryListModal,
  CategoryListModalContent,
  CategoryListModalFooter,
  CategoryListModalHeader,
  CategoryListModalTitle,
} from "@/components/ui/category-list-modal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Sparkles, MessageSquare } from "lucide-react";
import {
  RichTextEditor,
  RichTextEditorContent,
  RichTextEditorFooter,
  RichTextEditorHeader,
  RichTextEditorToolbar,
  RichTextEditorInput,
  RichTextEditorConfig,
} from "@/components/ui/rich-text-editor";
import {
  AssignDialog,
  AssignDialogContent,
  AssignDialogDescription,
  AssignDialogFooter,
  AssignDialogHeader,
  AssignDialogTitle,
} from "@/components/ui/assign-dialog";
import {
  Stage,
  StageContent,
  StageContextProvider,
  StageProvider,
  StageTrigger,
} from "@/components/ui/stage";
import {
  RichTextEditorActions,
  RichTextEditorActionsContent,
  RichTextEditorActionsFooter,
  RichTextEditorActionsHeader,
  RichTextEditorActionsToolbar,
  RichTextEditorActionsInput,
  RichTextEditorActionsConfig,
} from "@/components/ui/rich-text-editor-actions";
