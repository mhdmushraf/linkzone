import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useOrg } from "@/lib/OrgContext";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageCircle, Send, Package, ShoppingCart, Plus, Trash2, Loader2, ArrowLeft, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { format } from "date-fns";

export default function Inbox() {
  const { organization, user, appRole } = useOrg();
  const orgId = organization?.id;
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [productPicker, setProductPicker] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const scrollRef = useRef(null);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [conv, c, p] = await Promise.all([
      base44.entities.Conversation.filter({ organization_id: orgId }, "-last_message_at", 500),
      base44.entities.Customer.filter({ organization_id: orgId }, "-created_date", 500),
      base44.entities.Product.filter({ organization_id: orgId }, "-created_date", 500),
    ]);
    setConversations(conv);
    setCustomers(c);
    setProducts(p);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orgId]);

  // subscribe to conversation updates
  useEffect(() => {
    if (!orgId) return;
    const unsub = base44.entities.Conversation.subscribe(() => load());
    return unsub;
  }, [orgId]);

  const active = conversations.find((c) => c.id === activeId);

  const loadMessages = async (convId) => {
    if (!convId) return setMessages([]);
    const msgs = await base44.entities.Message.filter({ conversation_id: convId }, "created_date", 500);
    setMessages(msgs);
    // mark read
    const conv = conversations.find((c) => c.id === convId);
    if (conv?.data.unread_count > 0) {
      await base44.entities.Conversation.update(convId, { unread_count: 0 });
    }
  };

  useEffect(() => {
    loadMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === activeId) loadMessages(activeId);
    });
    return unsub;
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const startConversation = async (customer) => {
    const existing = conversations.find((c) => c.data.customer_id === customer.id);
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const conv = await base44.entities.Conversation.create({
      customer_id: customer.id,
      customer_name: customer.data.business_name,
      salesman_id: user.id,
      status: "active",
      organization_id: orgId,
      unread_count: 0,
    });
    setActiveId(conv.id);
    load();
  };

  const send = async (content, messageType = "text", productData = null) => {
    if (!activeId || (!content && messageType === "text")) return;
    setSending(true);
    try {
      await base44.entities.Message.create({
        conversation_id: activeId,
        sender: "salesman",
        content: content || "",
        message_type: messageType,
        product_data: productData,
        organization_id: orgId,
      });
      await base44.entities.Conversation.update(activeId, {
        last_message: content || (messageType === "product" ? "Shared a product" : ""),
        last_message_at: new Date().toISOString(),
      });
      setText("");
      loadMessages(activeId);
      load();
    } catch (e) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendProduct = async (product) => {
    await send(`${product.data.name} — ${product.data.pack_unit || ""} — $${product.data.price}`.trim(), "product", {
      name: product.data.name,
      pack_unit: product.data.pack_unit,
      price: product.data.price,
      photo_url: product.data.photo_url,
    });
    setProductPicker(false);
  };

  const addOrderItem = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setOrderItems((items) => {
      const existing = items.find((i) => i.product_id === productId);
      if (existing) return items.map((i) => (i.product_id === productId ? { ...i, qty: i.qty + 1 } : i));
      return [...items, { product_id: productId, name: p.data.name, price: p.data.price, qty: 1 }];
    });
  };

  const orderTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

  const createOrder = async () => {
    if (!active || orderItems.length === 0) return;
    try {
      await base44.entities.Order.create({
        customer_id: active.data.customer_id,
        customer_name: active.data.customer_name,
        conversation_id: active.id,
        salesman_id: user.id,
        items: orderItems,
        amount: orderTotal,
        paid_status: "due",
        delivery_status: "pending",
        order_date: new Date().toISOString(),
        organization_id: orgId,
      });
      await base44.entities.Message.create({
        conversation_id: active.id,
        sender: "system",
        content: `Order created — $${orderTotal.toFixed(2)} (${orderItems.length} items)`,
        message_type: "order",
        organization_id: orgId,
      });
      await base44.entities.Conversation.update(active.id, {
        last_message: `Order created — $${orderTotal.toFixed(2)}`,
        last_message_at: new Date().toISOString(),
      });
      // update customer last order + status
      const cust = customers.find((c) => c.id === active.data.customer_id);
      if (cust) await base44.entities.Customer.update(cust.id, { last_order_date: new Date().toISOString(), status: "active" });
      toast({ title: "Order created", description: `$${orderTotal.toFixed(2)}` });
      setOrderOpen(false);
      setOrderItems([]);
      loadMessages(active.id);
      load();
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const filteredConvs = conversations.filter((c) =>
    !query ? true : c.data.customer_name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader title="Inbox" subtitle="WhatsApp conversations with your customers" />

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex h-[calc(100vh-13rem)]">
        {/* Conversation list */}
        <div className={`${activeId ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 border-r border-border`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search conversations…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-3">No conversations yet. Start one from a customer:</p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {customers.map((c) => (
                    <button key={c.id} onClick={() => startConversation(c)} className="w-full text-left p-2 rounded-lg hover:bg-muted flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-600 shrink-0">
                        {c.data.business_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm truncate">{c.data.business_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              filteredConvs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border/40 flex items-center gap-3 transition-colors ${
                    activeId === c.id ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-600 shrink-0">
                    {c.data.customer_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-600 text-sm truncate">{c.data.customer_name}</p>
                      {c.data.last_message_at && (
                        <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(c.data.last_message_at), "dd MMM")}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.data.last_message || "No messages yet"}</p>
                  </div>
                  {c.data.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-600 flex items-center justify-center shrink-0">
                      {c.data.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`${activeId ? "flex" : "hidden sm:flex"} flex-col flex-1`}>
          {active ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button className="sm:hidden p-1 -ml-1" onClick={() => setActiveId(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-600">
                  {active.data.customer_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-600 text-sm truncate">{active.data.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{customers.find((c) => c.id === active.data.customer_id)?.data?.whatsapp_number || ""}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setOrderOpen(true)}>
                  <ShoppingCart className="w-4 h-4 mr-1.5" /> Create order
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Send your first message or share a product to start the conversation.</p>
                )}
                {messages.map((m) => {
                  const isMe = m.data.sender === "salesman";
                  const isSystem = m.data.sender === "system";
                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">{m.data.content}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${isMe ? "bg-primary text-primary-foreground" : "bg-card border border-border"} rounded-2xl px-3.5 py-2.5 shadow-sm`}>
                        {m.data.message_type === "product" && m.data.product_data?.photo_url && (
                          <div className="mb-2 rounded-lg overflow-hidden">
                            <Image src={m.data.product_data.photo_url} alt="" className="w-full h-32" fittingType="fill" />
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{m.data.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {format(new Date(m.created_date), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-border">
                <div className="flex items-end gap-2">
                  <Button size="icon" variant="outline" onClick={() => setProductPicker(true)} title="Share product">
                    <Package className="w-4 h-4" />
                  </Button>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
                  />
                  <Button size="icon" onClick={() => send(text)} disabled={sending || !text.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageCircle} title="Select a conversation" description="Choose a customer on the left to start chatting." />
            </div>
          )}
        </div>
      </div>

      {/* Product picker */}
      <Dialog open={productPicker} onOpenChange={setProductPicker}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share a product</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No products in your catalog yet.</p>
            ) : (
              products.map((p) => (
                <button key={p.id} onClick={() => sendProduct(p)} className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-left">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                    {p.data.photo_url ? <Image src={p.data.photo_url} alt="" className="w-full h-full" fittingType="fill" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-600 text-sm truncate">{p.data.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.data.pack_unit}</p>
                  </div>
                  <span className="font-700 text-sm">${p.data.price}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create order */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create order</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Add products</Label>
            <Select onValueChange={addOrderItem}>
              <SelectTrigger><SelectValue placeholder="Select a product to add" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.data.name} — ${p.data.price}</SelectItem>)}
              </SelectContent>
            </Select>
            {orderItems.length > 0 && (
              <div className="space-y-2 mt-2">
                {orderItems.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price} × {item.qty}</p>
                    </div>
                    <button onClick={() => setOrderItems((items) => items.map((i) => i.product_id === item.product_id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0))} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">−</button>
                    <button onClick={() => setOrderItems((items) => items.map((i) => i.product_id === item.product_id ? { ...i, qty: i.qty + 1 } : i))} className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">+</button>
                    <button onClick={() => setOrderItems((items) => items.filter((i) => i.product_id !== item.product_id))} className="w-7 h-7 rounded-md bg-muted text-rose-500 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-600">Total</span>
                  <span className="font-700 font-heading text-lg">${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>Cancel</Button>
            <Button onClick={createOrder} disabled={orderItems.length === 0}>
              <ShoppingCart className="w-4 h-4 mr-1.5" /> Create order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}