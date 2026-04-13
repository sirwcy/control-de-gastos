import type { Category, Subcategory, SubSubcategory, CategoryRef } from '../types'

export function getFullPath(
  ref: CategoryRef,
  categories: Category[],
  subcategories: Subcategory[],
  subSubcategories: SubSubcategory[],
): string {
  const cat = categories.find(c => c.id === ref.categoryId)
  if (!cat) return '—'
  if (ref.level === 'category') return cat.name

  const sub = subcategories.find(s => s.id === ref.subcategoryId)
  if (!sub) return cat.name
  if (ref.level === 'subcategory') return `${cat.name} › ${sub.name}`

  const subsub = subSubcategories.find(s => s.id === ref.subSubcategoryId)
  if (!subsub) return `${cat.name} › ${sub.name}`
  return `${cat.name} › ${sub.name} › ${subsub.name}`
}

export function getRefLabel(
  ref: CategoryRef,
  categories: Category[],
  subcategories: Subcategory[],
  subSubcategories: SubSubcategory[],
): string {
  if (ref.level === 'category') {
    return categories.find(c => c.id === ref.categoryId)?.name ?? '—'
  }
  if (ref.level === 'subcategory') {
    return subcategories.find(s => s.id === ref.subcategoryId)?.name ?? '—'
  }
  return subSubcategories.find(s => s.id === ref.subSubcategoryId)?.name ?? '—'
}

export function getCategoryForRef(ref: CategoryRef, categories: Category[]): Category | undefined {
  return categories.find(c => c.id === ref.categoryId)
}
