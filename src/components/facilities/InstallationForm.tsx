"use client";

import { FormEvent, useState } from "react";
import type { Installation, ProductionRouteType, Sector } from "@/lib/types";
import { PRODUCTION_ROUTE_LABELS, ROUTE_TYPES_BY_SECTOR } from "@/lib/config/process-templates";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface InstallationFormValues {
  name: string;
  city: string;
  address: string;
  lat: string;
  lng: string;
  unLocode: string;
  productionRouteType: ProductionRouteType;
}

interface InstallationFormProps {
  sector: Sector;
  initial?: Partial<Installation>;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: InstallationFormValues) => void;
  onCancel?: () => void;
}

export function InstallationForm({
  sector,
  initial,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: InstallationFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [lat, setLat] = useState(initial?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initial?.lng?.toString() ?? "");
  const [unLocode, setUnLocode] = useState(initial?.unLocode ?? "");
  const [productionRouteType, setProductionRouteType] = useState<ProductionRouteType>(
    (initial?.productionRouteType as ProductionRouteType) ?? "diger"
  );

  const routeOptions = [...(ROUTE_TYPES_BY_SECTOR[sector] ?? []), "diger"];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, city, address, lat, lng, unLocode, productionRouteType });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Tesis adı</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="city">Şehir</Label>
          <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Adres</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="lat">Enlem (lat)</Label>
          <Input id="lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="lng">Boylam (lng)</Label>
          <Input id="lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="unLocode">UN/LOCODE</Label>
          <Input id="unLocode" placeholder="ör. TRIST" value={unLocode} onChange={(e) => setUnLocode(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="route">Üretim rotası</Label>
        <Select
          id="route"
          value={productionRouteType}
          onChange={(e) => setProductionRouteType(e.target.value as ProductionRouteType)}
        >
          {routeOptions.map((r) => (
            <option key={r} value={r}>
              {PRODUCTION_ROUTE_LABELS[r] ?? r}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Kaydediliyor..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Vazgeç
          </Button>
        )}
      </div>
    </form>
  );
}
