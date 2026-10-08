import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Linking, Modal, Platform, Pressable, TextInput, useWindowDimensions, View } from 'react-native'
import { Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import Head from 'expo-router/head'
import Refresh from '../assets/icons/refresh.svg'
import Search from '../assets/icons/search.svg'
import Trash from '../assets/icons/trash.svg'
import * as auth from '../helpers/auth'
import { useAuth } from '../hooks/useAuth'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import HText from '../components/htext'
import { UserAvatar } from '../components/userAvatar'
import * as format from '../helpers/format'

const PAGE_SIZE = 50
const MIN_DESKTOP_WIDTH = 1180
const MIN_DESKTOP_HEIGHT = 640
const CONTEXTS = [
  { key: 'users', context: 'user', singular: 'User', label: 'Users', description: 'Flagged accounts', route: 'profile' },
  { key: 'lists', context: 'list', singular: 'List', label: 'Lists', description: 'Flagged collections', route: 'list' },
  { key: 'reviews', context: 'review', singular: 'Review', label: 'Reviews', description: 'Flagged film reviews', route: 'review' },
  { key: 'comments', context: 'comment', singular: 'Comment', label: 'Comments', description: 'Flagged discussion', route: 'review' }
]
const COMMENT_TOMBSTONE_MESSAGES = {
  DeletedByAuthor: 'This comment was deleted by the original author',
  DeletedByAdmin: 'This comment was deleted by a community moderator',
  OriginalAuthorDeleted: 'This comment was written by a user that no longer exists'
}

const getInitialSections = () => Object.fromEntries(CONTEXTS.map(({ key }) => [key, { page: 1, items: [], totalCount: 0, status: Response.initial }]))

const AdminHead = () => (
  <Head>
    <title>Admin</title>
    <meta name='description' content='Heteroboxd administration dashboard' />
    <meta name='robots' content='noindex, nofollow' />
    <link rel='icon' type='image/x-icon' href='https://www.heteroboxd.com/favicon.ico' />
  </Head>
)

const IconButton = ({ children, disabled, label, onPress, style }) => (
  <Pressable
    accessibilityLabel={label}
    disabled={disabled}
    onPress={onPress}
    style={({ hovered, pressed }) => [style, { opacity: disabled ? 0.4 : pressed ? 0.65 : hovered ? 0.82 : 1 }]}
  >
    {children}
  </Pressable>
)

const Admin = () => {
  const { user, isValidSession } = useAuth()
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  const requestNumber = useRef({})
  const [ aJwt, setAJwt ] = useState(null)
  const [ key, setKey ] = useState('')
  const [ activeContext, setActiveContext ] = useState('users')
  const [ query, setQuery ] = useState('')
  const [ focusedInput, setFocusedInput ] = useState('')
  const [ timeLeft, setTimeLeft ] = useState(-1)
  const [ sections, setSections ] = useState(getInitialSections)
  const [ adminStatus, setAdminStatus ] = useState(Response.initial)
  const [ deleteStatus, setDeleteStatus ] = useState(Response.initial)
  const [ confirmDelete, setConfirmDelete ] = useState(null)

  const isDesktop = Platform.OS === 'web' && width >= MIN_DESKTOP_WIDTH && height >= MIN_DESKTOP_HEIGHT
  const active = useMemo(() => CONTEXTS.find(item => item.key === activeContext), [activeContext])
  const activeSection = sections[activeContext]
  const setSection = useCallback((context, update) => {
    setSections(prev => ({ ...prev, [context]: typeof update === 'function' ? update(prev[context]) : update }))
  }, [])
  const lockDashboard = useCallback(() => {
    setAJwt(null)
    setKey('')
    setQuery('')
    setTimeLeft(-1)
    setSections(getInitialSections())
  }, [])

  const handleSubmitKey = useCallback(async () => {
    if (!key.trim()) return
    if (!(await isValidSession())) {
      setAdminStatus(Response.forbidden)
      return
    }
    setAdminStatus(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/auth/admin?Key=${encodeURIComponent(key.trim())}`, { headers: { 'Authorization': `Bearer ${jwt}` } })
      if (!res.ok) {
        setAdminStatus(res.status === 400 ? Response.badRequest : res.status === 401 || res.status === 403 ? Response.forbidden : Response.internalServerError)
        return
      }
      const token = await res.text()
      if (!token) throw new Error('Empty admin token')
      setAJwt(token)
      setAdminStatus(Response.ok)
    } catch {
      setAdminStatus(Response.networkError)
    }
  }, [isValidSession, key])

  const loadSection = useCallback(async (context, page = 1) => {
    const request = (requestNumber.current[context] || 0) + 1
    requestNumber.current[context] = request
    setSection(context, prev => ({ ...prev, status: Response.loading }))
    try {
      const res = await fetch(`${BaseUrl.api}/admin/${context}?Page=${page}&PageSize=${PAGE_SIZE}`, { headers: { 'Authorization': `Bearer ${aJwt}` } })
      if (request !== requestNumber.current[context]) return
      if (!res.ok) {
        setSection(context, prev => ({ ...prev, status: res.status === 401 || res.status === 403 ? Response.forbidden : Response.internalServerError }))
        return
      }
      const json = await res.json()
      if (!Array.isArray(json.items)) throw new Error('Malformed page response')
      setSection(context, { page: Number.isInteger(json.page) && json.page > 0 ? json.page : page, items: json.items, totalCount: Number.isFinite(json.totalCount) ? json.totalCount : json.items.length, status: Response.ok })
    } catch {
      if (request === requestNumber.current[context]) setSection(context, prev => ({ ...prev, status: Response.networkError }))
    }
  }, [aJwt, setSection])

  const handleSearch = useCallback(async () => {
    const id = query.trim()
    if (!id) {
      loadSection(activeContext, 1)
      return
    }
    const request = (requestNumber.current[activeContext] || 0) + 1
    requestNumber.current[activeContext] = request
    setSection(activeContext, prev => ({ ...prev, status: Response.loading }))
    try {
      const res = await fetch(`${BaseUrl.api}/admin?Context=${encodeURIComponent(active.context)}&Id=${encodeURIComponent(id)}`, { headers: { 'Authorization': `Bearer ${aJwt}` } })
      if (request !== requestNumber.current[activeContext]) return
      if (!res.ok) {
        setSection(activeContext, prev => ({ ...prev, items: [], page: 1, totalCount: 0, status: res.status === 404 ? Response.notFound : res.status === 401 || res.status === 403 ? Response.forbidden : Response.internalServerError }))
        return
      }
      const item = await res.json()
      setSection(activeContext, { page: 1, items: item ? [item] : [], totalCount: item ? 1 : 0, status: item ? Response.ok : Response.notFound })
    } catch {
      if (request === requestNumber.current[activeContext]) setSection(activeContext, prev => ({ ...prev, status: Response.networkError }))
    }
  }, [aJwt, active, activeContext, loadSection, query, setSection])

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return
    const { context, id } = confirmDelete
    setDeleteStatus(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/admin?Context=${encodeURIComponent(context)}&Id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${aJwt}` } })
      if (!res.ok) {
        setDeleteStatus(res.status === 400 ? Response.badRequest : res.status === 404 ? Response.notFound : res.status === 401 || res.status === 403 ? Response.forbidden : Response.internalServerError)
        return
      }
      setConfirmDelete(null)
      setDeleteStatus(Response.ok)
      loadSection(activeContext, activeSection.page)
    } catch {
      setDeleteStatus(Response.networkError)
    }
  }, [aJwt, activeContext, activeSection.page, confirmDelete, loadSection])

  const openItem = useCallback((item) => {
    const id = activeContext === 'comments' ? item.reviewId : item.id
    if (id) Linking.openURL(`/${active.route}/${id}`)
  }, [active, activeContext])

  useEffect(() => {
    if (Platform.OS !== 'web') router.replace('/login')
    else if (user && !user.admin) router.replace('/login')
  }, [router, user])

  useEffect(() => {
    if (aJwt) Promise.all(CONTEXTS.map(({ key: context }) => loadSection(context, 1)))
  }, [aJwt, loadSection])

  useEffect(() => {
    if (!aJwt) return
    setTimeLeft(30 * 60)
    const interval = setInterval(() => setTimeLeft(prev => Math.max(prev - 1, 0)), 1000)
    return () => clearInterval(interval)
  }, [aJwt])

  useEffect(() => {
    if (timeLeft === 0) lockDashboard()
  }, [lockDashboard, timeLeft])

  const renderItem = ({ item }) => {
    const isTombstoned = activeContext === 'comments' && item.tombstone !== null && item.tombstone !== undefined
    const isComment = activeContext === 'comments'
    const title = activeContext === 'users' ? item.name : activeContext === 'lists' ? item.name : activeContext === 'reviews' ? item.filmTitle : item.authorName
    const subtitle = activeContext === 'users'
      ? `User ID: ${item.id}`
      : activeContext === 'lists' ? `${item.listEntryCount || 0} entries`
      : activeContext === 'reviews' ? `${format.parseOutYear(item.filmDate) || 'Unknown year'} · ${format.sliceText(item.text || '', 120)}`
      : isTombstoned ? COMMENT_TOMBSTONE_MESSAGES[item.tombstone] || 'This comment is unavailable' : format.sliceText(item.text || '', 120)
    return (
      <View style={styles.itemCard}>
        <Pressable accessibilityLabel={`Open ${active.singular}`} onPress={() => openItem(item)} style={({ hovered, pressed }) => [styles.itemContent, { opacity: pressed ? 0.65 : hovered ? 0.86 : 1 }]}>
          {activeContext === 'users' || (isComment && !isTombstoned && item.authorPictureUrl) ? <UserAvatar pictureUrl={activeContext === 'users' ? item.pictureUrl || null : item.authorPictureUrl || null} style={styles.avatar} /> : null}
          <View style={styles.itemCopy}>
            <HText numberOfLines={1} style={styles.itemTitle}>{title || 'Untitled'}</HText>
            <HText numberOfLines={activeContext === 'reviews' || activeContext === 'comments' ? 2 : 1} style={[styles.itemSubtitle, isTombstoned && styles.tombstone]}>{subtitle}</HText>
          </View>
        </Pressable>
        <View style={styles.itemMeta}>
          {Number.isFinite(item.flags) && item.flags > 0 ? <HText style={styles.flagCount}>{item.flags}</HText> : null}
          {!isTombstoned ? <IconButton label={`Delete ${active.singular}`} onPress={() => setConfirmDelete({ context: active.context, id: item.id, label: title || active.singular })} style={styles.deleteButton}><Trash width={18} height={18} /></IconButton> : null}
        </View>
      </View>
    )
  }

  const minutes = String(Math.max(Math.floor(timeLeft / 60), 0)).padStart(2, '0')
  const seconds = String(Math.max(timeLeft % 60, 0)).padStart(2, '0')
  const timerColor = timeLeft > 15 * 60 ? Colors.success : timeLeft > 3 * 60 ? Colors.password_solid : Colors.password_meager
  const maxPage = Math.max(1, Math.ceil(activeSection.totalCount / PAGE_SIZE))
  const notification = deleteStatus.result >= 400 ? deleteStatus : activeSection.status.result >= 400 ? activeSection.status : adminStatus.result >= 400 ? adminStatus : null

  if (!isDesktop) return (
    <><AdminHead /><View style={styles.desktopGate}><View style={styles.desktopGateCard}><HText style={styles.eyebrow}>HETEROBOXD / ADMIN</HText><HText style={styles.desktopGateTitle}>Desktop workspace required</HText><HText style={styles.desktopGateBody}>The moderation dashboard is intentionally available only on widescreen web browsers. Open it on a desktop display at least {MIN_DESKTOP_WIDTH}px wide.</HText></View></View></>
  )

  if (!aJwt) return (
    <><AdminHead /><View style={styles.keyScreen}><View style={styles.keyCard}><HText style={styles.eyebrow}>HETEROBOXD / ADMIN</HText><HText style={styles.keyTitle}>Moderation workspace</HText><HText style={styles.keyBody}>Enter the rotating dashboard key to begin a 30-minute moderation session.</HText><HText style={styles.inputLabel}>Dashboard key</HText><TextInput value={key} autoCapitalize='none' autoCorrect={false} onChangeText={setKey} onFocus={() => setFocusedInput('key')} onBlur={() => setFocusedInput('')} onSubmitEditing={handleSubmitKey} placeholder='Enter dashboard key' placeholderTextColor={Colors.text_placeholder} secureTextEntry style={[styles.input, focusedInput === 'key' && styles.inputFocused]} /><Pressable disabled={!key.trim() || adminStatus.result === 0} onPress={handleSubmitKey} style={({ pressed }) => [styles.primaryButton, (!key.trim() || adminStatus.result === 0) && styles.disabledButton, pressed && { opacity: 0.8 }]}>{adminStatus.result === 0 ? <ActivityIndicator color={Colors.text_button} /> : <HText style={styles.primaryButtonText}>Unlock dashboard</HText>}</Pressable></View></View><Snackbar visible={!!notification} onDismiss={() => setAdminStatus(Response.initial)} duration={4000} style={styles.snackbar} action={{ label: 'Dismiss', onPress: () => setAdminStatus(Response.initial), textColor: Colors.text_link }}>{notification?.message}</Snackbar></>
  )

  return (
    <><AdminHead /><View style={styles.screen}>
      <View style={styles.header}><View><HText style={styles.eyebrow}>HETEROBOXD / ADMIN</HText><HText style={styles.dashboardTitle}>Moderation workspace</HText></View><View style={styles.sessionBox}><View style={[styles.sessionDot, { backgroundColor: timerColor }]} /><View><HText style={styles.sessionLabel}>SESSION EXPIRES IN</HText><HText style={[styles.sessionTime, { color: timerColor }]}>{minutes}:{seconds}</HText></View><IconButton label='Lock dashboard' onPress={lockDashboard} style={styles.lockButton}><HText style={styles.lockButtonText}>Lock</HText></IconButton></View></View>
      <View style={styles.workspace}>
        <View style={styles.sidebar}><HText style={styles.sidebarLabel}>REVIEW QUEUES</HText>{CONTEXTS.map(item => { const section = sections[item.key]; const selected = activeContext === item.key; return <Pressable key={item.key} onPress={() => { setActiveContext(item.key); setQuery('') }} style={({ hovered, pressed }) => [styles.navItem, selected && styles.navItemSelected, { opacity: pressed ? 0.7 : hovered && !selected ? 0.8 : 1 }]}><View><HText style={[styles.navTitle, selected && styles.navTitleSelected]}>{item.label}</HText><HText style={[styles.navDescription, selected && styles.navDescriptionSelected]}>{item.description}</HText></View><HText style={[styles.navCount, selected && styles.navCountSelected]}>{format.formatCount(section.totalCount || 0)}</HText></Pressable> })}<View style={styles.sidebarFooter}><HText style={styles.sidebarFooterText}>Exact-ID search and destructive actions use the existing admin API.</HText></View></View>
        <View style={styles.content}>
          <View style={styles.contentHeader}><View><HText style={styles.contentTitle}>{active.label}</HText><HText style={styles.contentSubtitle}>{activeSection.totalCount === 1 ? '1 item awaiting review' : `${format.formatCount(activeSection.totalCount || 0)} items awaiting review`}</HText></View><View style={styles.tools}><TextInput value={query} autoCapitalize='none' autoCorrect={false} onChangeText={setQuery} onFocus={() => setFocusedInput('search')} onBlur={() => setFocusedInput('')} onSubmitEditing={handleSearch} placeholder={`Find ${active.singular.toLowerCase()} by exact ID`} placeholderTextColor={Colors.text_placeholder} style={[styles.searchInput, focusedInput === 'search' && styles.inputFocused]} /><IconButton label={`Search ${active.label}`} onPress={handleSearch} disabled={activeSection.status.result === 0} style={styles.toolButton}><Search width={18} height={18} fill={Colors.text_button} /></IconButton><IconButton label={`Refresh ${active.label}`} onPress={() => { setQuery(''); loadSection(activeContext, 1) }} disabled={activeSection.status.result === 0} style={styles.toolButton}><Refresh width={20} height={20} /></IconButton></View></View>
          <View style={styles.listShell}><FlatList data={activeSection.items} keyExtractor={(item, index) => item.id || `${activeContext}-${index}`} renderItem={renderItem} contentContainerStyle={activeSection.items.length === 0 ? styles.emptyList : styles.listContent} showsVerticalScrollIndicator={false} ListEmptyComponent={activeSection.status.result === 0 ? <View style={styles.emptyState}><ActivityIndicator size='large' color={Colors.text_link} /><HText style={styles.emptyCopy}>Loading moderation queue…</HText></View> : <View style={styles.emptyState}><HText style={styles.emptyTitle}>{activeSection.status.result === 404 ? 'No matching item' : 'Queue is clear'}</HText><HText style={styles.emptyCopy}>{activeSection.status.result === 404 ? 'Check the ID and try again, or refresh this queue.' : 'There are no items to review in this queue right now.'}</HText></View>} /></View>
          <View style={styles.pagination}><HText style={styles.paginationCopy}>Page {activeSection.page} of {maxPage}</HText><View style={styles.paginationActions}><Pressable disabled={activeSection.page <= 1 || activeSection.status.result === 0} onPress={() => loadSection(activeContext, activeSection.page - 1)} style={({ pressed }) => [styles.secondaryButton, (activeSection.page <= 1 || activeSection.status.result === 0) && styles.disabledSecondaryButton, pressed && { opacity: 0.75 }]}><HText style={styles.secondaryButtonText}>Previous</HText></Pressable><Pressable disabled={activeSection.page >= maxPage || activeSection.status.result === 0} onPress={() => loadSection(activeContext, activeSection.page + 1)} style={({ pressed }) => [styles.secondaryButton, (activeSection.page >= maxPage || activeSection.status.result === 0) && styles.disabledSecondaryButton, pressed && { opacity: 0.75 }]}><HText style={styles.secondaryButtonText}>Next</HText></Pressable></View></View>
        </View>
      </View>
    </View>
    <Modal transparent visible={!!confirmDelete} animationType='fade' onRequestClose={() => setConfirmDelete(null)}><View style={styles.modalOverlay}><View style={styles.modalCard}><HText style={styles.modalEyebrow}>DESTRUCTIVE ACTION</HText><HText style={styles.modalTitle}>Delete this {confirmDelete?.context}?</HText><HText style={styles.modalBody}>“{format.sliceText(confirmDelete?.label || '', 80)}” will be deleted through the existing admin API. This cannot be undone from the dashboard.</HText><View style={styles.modalActions}><Pressable disabled={deleteStatus.result === 0} onPress={() => setConfirmDelete(null)} style={styles.modalCancel}><HText style={styles.secondaryButtonText}>Cancel</HText></Pressable><Pressable disabled={deleteStatus.result === 0} onPress={handleDelete} style={[styles.dangerButton, deleteStatus.result === 0 && styles.disabledButton]}>{deleteStatus.result === 0 ? <ActivityIndicator color={Colors.text_button} /> : <HText style={styles.primaryButtonText}>Delete permanently</HText>}</Pressable></View></View></View></Modal>
    <Snackbar visible={!!notification} onDismiss={() => { setDeleteStatus(Response.initial); setSection(activeContext, prev => ({ ...prev, status: Response.initial })) }} duration={4000} style={styles.snackbar} action={{ label: 'Dismiss', onPress: () => { setDeleteStatus(Response.initial); setSection(activeContext, prev => ({ ...prev, status: Response.initial })) }, textColor: Colors.text_link }}>{notification?.message}</Snackbar>
    </>
  )
}

const styles = {
  screen: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 28, paddingVertical: 24 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: Colors.border_color }, eyebrow: { color: Colors.heteroboxd, fontSize: 11, fontWeight: '600', letterSpacing: 1.4 }, dashboardTitle: { color: Colors.text_title, fontSize: 28, fontWeight: '600', marginTop: 5 }, sessionBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 10, paddingVertical: 9, paddingLeft: 13, paddingRight: 8, gap: 10 }, sessionDot: { width: 8, height: 8, borderRadius: 4 }, sessionLabel: { color: Colors.text, fontSize: 10, letterSpacing: 0.8 }, sessionTime: { fontSize: 18, fontWeight: '600', marginTop: 1 }, lockButton: { marginLeft: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: Colors.border_color }, lockButtonText: { color: Colors.text_button, fontSize: 13, fontWeight: '600' },
  workspace: { flex: 1, flexDirection: 'row', minHeight: 0, marginTop: 22, gap: 22 }, sidebar: { width: 235, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 12, padding: 12 }, sidebarLabel: { color: Colors.text, fontSize: 10, fontWeight: '600', letterSpacing: 1.2, marginVertical: 8, marginHorizontal: 8 }, navItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, padding: 12, marginBottom: 4 }, navItemSelected: { backgroundColor: Colors.heteroboxd }, navTitle: { color: Colors.text_title, fontSize: 16, fontWeight: '600' }, navTitleSelected: { color: Colors.background }, navDescription: { color: Colors.text, fontSize: 12, marginTop: 2 }, navDescriptionSelected: { color: '#4b2c00' }, navCount: { color: Colors.heteroboxd, fontSize: 14, fontWeight: '600', marginLeft: 10 }, navCountSelected: { color: Colors.background }, sidebarFooter: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: Colors.border_color, padding: 10 }, sidebarFooterText: { color: Colors.text, fontSize: 11, lineHeight: 16 },
  content: { flex: 1, minWidth: 0, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 12, padding: 20 }, contentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 18, gap: 18 }, contentTitle: { color: Colors.text_title, fontSize: 24, fontWeight: '600' }, contentSubtitle: { color: Colors.text, fontSize: 13, marginTop: 4 }, tools: { flexDirection: 'row', alignItems: 'center', gap: 7 }, input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 7, color: Colors.text_input, fontFamily: 'Inter_400Regular', fontSize: 15, paddingHorizontal: 12, height: 44, outlineStyle: 'none' }, searchInput: { width: 245, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 7, color: Colors.text_input, fontFamily: 'Inter_400Regular', fontSize: 13, paddingHorizontal: 11, height: 38, outlineStyle: 'none' }, inputFocused: { borderColor: Colors.heteroboxd }, toolButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 7 }, listShell: { flex: 1, minHeight: 0, borderTopWidth: 1, borderTopColor: Colors.border_color }, listContent: { paddingVertical: 12 }, emptyList: { flexGrow: 1 },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 9, padding: 12, marginBottom: 8 }, itemContent: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' }, avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 11 }, itemCopy: { flex: 1, minWidth: 0 }, itemTitle: { color: Colors.text_title, fontSize: 15, fontWeight: '600' }, itemSubtitle: { color: Colors.text, fontSize: 12, lineHeight: 17, marginTop: 3 }, tombstone: { fontStyle: 'italic' }, itemMeta: { minWidth: 48, marginLeft: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }, flagCount: { color: Colors.heteroboxd, fontSize: 15, fontWeight: '600' }, deleteButton: { padding: 7, borderRadius: 6, backgroundColor: Colors.card }, emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, emptyTitle: { color: Colors.text_title, fontSize: 18, fontWeight: '600' }, emptyCopy: { color: Colors.text, fontSize: 13, marginTop: 8, textAlign: 'center', maxWidth: 340 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border_color, paddingTop: 15 }, paginationCopy: { color: Colors.text, fontSize: 13 }, paginationActions: { flexDirection: 'row', gap: 8 }, secondaryButton: { borderWidth: 1, borderColor: Colors.border_color, backgroundColor: Colors.background, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 6 }, disabledSecondaryButton: { opacity: 0.35 }, secondaryButtonText: { color: Colors.text_button, fontSize: 13, fontWeight: '600' },
  keyScreen: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 28 }, keyCard: { width: 440, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 14, padding: 30 }, keyTitle: { color: Colors.text_title, fontSize: 26, fontWeight: '600', marginTop: 8 }, keyBody: { color: Colors.text, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 25 }, inputLabel: { color: Colors.text_input, fontSize: 13, marginBottom: 7 }, primaryButton: { height: 44, marginTop: 14, backgroundColor: Colors.heteroboxd, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, dangerButton: { minWidth: 145, height: 40, paddingHorizontal: 14, backgroundColor: Colors.password_meager, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { color: Colors.background, fontSize: 14, fontWeight: '600' }, disabledButton: { opacity: 0.45 },
  desktopGate: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 28 }, desktopGateCard: { maxWidth: 460, borderLeftWidth: 3, borderLeftColor: Colors.heteroboxd, paddingLeft: 22 }, desktopGateTitle: { color: Colors.text_title, fontSize: 26, fontWeight: '600', marginTop: 8 }, desktopGateBody: { color: Colors.text, fontSize: 15, lineHeight: 23, marginTop: 11 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }, modalCard: { width: 440, maxWidth: '100%', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border_color, borderRadius: 12, padding: 24 }, modalEyebrow: { color: Colors.password_meager, fontSize: 10, fontWeight: '600', letterSpacing: 1.1 }, modalTitle: { color: Colors.text_title, fontSize: 21, fontWeight: '600', marginTop: 7 }, modalBody: { color: Colors.text, fontSize: 14, lineHeight: 20, marginTop: 10 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 24 }, modalCancel: { paddingHorizontal: 12, paddingVertical: 10 }, snackbar: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border_color, alignSelf: 'center', borderRadius: 8, maxWidth: 600 }
}

export default Admin
